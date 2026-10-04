/**
 * Every call the chat makes to the server, in one place. The browser never reads
 * a log and never decides a number: it posts what the owner did and draws what
 * comes back.
 */
import {
  SERVER_URL,
  type CarProfile,
  type DriveWindow,
  type FlashPlan,
  type DriveBrief,
  type HarnessSummary,
  type Picture,
  type InstallRow,
  type OpenStep,
  type OwnerQuestion,
  type ProfileDraft,
  type ProfileSpec,
  type ReplyCard,
} from "./types";

async function post<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail ?? `${fallback} (${response.status}).`);
  return payload as T;
}

export type PendingQuestion = { id: string; title: string; askedOn?: string | null; askedOnStamp?: string | null };

/** The loop as the server holds it: what the sidebar mirrors and the journey is read from. */
export type LoopState = {
  carProfile: CarProfile | null;
  profileSpec: ProfileSpec | null;
  hasDrives: boolean;
  hasLlm: boolean;
  driveWindow: DriveWindow | null;
  ktunerBasemap: string;
  carHistory: { id: string; start?: number | null }[];
  flashes: { id: string; flashed_at?: number; time?: number; map?: string }[];
  installs: InstallRow[];
  activeMapVersion: { n: number; label: string; name: string } | null;
  openSteps: OpenStep[];
  unansweredQuestions: PendingQuestion[];
  flashPlan: FlashPlan | null;
  logGuide?: DriveBrief | null;
  /** Where the car is, the Recap and the stage's suggested replies (the front desk). */
  stage?: string;
  recap?: Recap | null;
  suggestions?: Suggestion[];
  capabilities?: Capability[];
};

/** A suggested reply: send words, open the drive brief, attach a log, or fill the example. */
export type Suggestion = { label: string; action: "send" | "guide" | "attach" | "example" | "edit-car"; text?: string; icon?: string };

/** Where the car is, for a new chat or a greeting: who, the round, the last drive, what's open. */
export type Recap = {
  car: string;
  parts: string;
  map: string;
  round: number;
  stage: string;
  stageLine: string;
  lines: { label: string; value: string }[];
};

/** What the assistant can do, with its limit. */
export type Capability = { id: string; status: "can" | "partly" | "cannot"; title: string; says: string; limit?: string };

export async function readLoop(): Promise<LoopState | null> {
  try {
    const response = await fetch(`${SERVER_URL}/api/state`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as LoopState) : null;
  } catch {
    return null;
  }
}

/** What the owner tags a log with: the fuel in the tank and the KTuner map slot it ran on. */
export type LogTags = { fuel: string; slot: number };
export const FUELS = ["E10 RON95 III", "E10 RON97 III"] as const;

export async function uploadCsv(file: File, threadId: string, tags?: LogTags): Promise<{ uploadId: string }> {
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("threadId", threadId);
  if (tags) {
    body.append("fuel", tags.fuel);
    body.append("slot", String(tags.slot));
  }
  const response = await fetch(`${SERVER_URL}/upload`, { method: "POST", body });
  if (!response.ok) throw new Error(`The upload did not go through (${response.status}).`);
  return (await response.json()) as { uploadId: string };
}

/** What a typed question comes back with: the answer, the window it reads, the cards it cites. */
export type AskAnswer = {
  kind: string;
  answer?: string;
  draft?: ProfileDraft;
  window?: string;
  citations?: { id: string; title: string }[];
  nextStep?: ReplyCard["nextStep"] | string | null;
  /** What the tuner did to answer, and its own unchecked thinking. */
  harness?: HarnessSummary | null;
  thinking?: string | null;
  /** The picture the tuner chose for this answer, drawn from the engine's data. */
  pictures?: Picture[] | null;
  agent?: { verified: boolean; fallback: string | null; issues: string[] } | null;
  /** The front desk's extras: the Recap, the drive brief, chips, and what the answer read. */
  intent?: string;
  suggestions?: Suggestion[];
  basis?: string | null;
  /** The cards the agent chose to show (AG-UI frontend tools), with the server's own data in them. */
  ui?: UiCard[];
};

/** One card the agent showed: the server validated it and filled it from the Car file. */
export type UiCard =
  | { tool: "show_recap"; recap: Recap }
  | { tool: "show_car_editor"; draft: ProfileDraft }
  | { tool: "show_drive_brief" }
  | { tool: "show_capabilities"; capabilities: Capability[] };

export const ask = (text: string) => post<AskAnswer>("/api/ask", { text }, "The question did not go through");

/**
 * The same answer, streamed: `onStep` hears each tool the tuner runs as it starts, so the
 * work row is live like a Drive reply's; resolves with the answer.
 */
export async function askStream(text: string, onStep: (title: string, name: string) => void): Promise<AskAnswer> {
  const response = await fetch(`${SERVER_URL}/api/ask/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? `The question did not go through (${response.status}).`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as { type: string; phase?: string; name?: string; title?: string; answer?: AskAnswer; message?: string };
      if (event.type === "step" && event.phase === "start") onStep(event.title ?? "", event.name ?? "");
      else if (event.type === "answer" && event.answer) return event.answer;
      else if (event.type === "error") throw new Error(event.message ?? "The question did not go through.");
    }
    if (done) throw new Error("The answer was cut off. Send it again.");
  }
}

export const saveProfile = (fields: CarProfile) =>
  post<{ profile: CarProfile; installs: InstallRow[]; line: string }>("/api/profile", { fields }, "The profile did not save");

export async function askScreenshot(file: File, text: string): Promise<AskAnswer> {
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("text", text);
  const response = await fetch(`${SERVER_URL}/api/screenshot`, { method: "POST", body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail ?? `The picture did not go through (${response.status}).`);
  return payload as AskAnswer;
}

/** The answer to one owner question, and the reply re-decided with it applied. */
export type AnswerResult = {
  questions: OwnerQuestion[] | null;
  nextStep: ReplyCard["nextStep"];
  housing: ReplyCard["housing"];
  cause?: string | null;
  unansweredQuestions: PendingQuestion[];
};

export const answerQuestion = (kind: string, driveId: string, choice: string) =>
  post<AnswerResult>("/api/answer", { kind, driveId, choice }, "The answer did not go through");

/** "I flashed it", "Not now", Undo or Revert: what the server says happened. */
export type FlashOutcome = { line: string; next?: string; created?: boolean };

export const flashConfirm = (changeId: string) =>
  post<FlashOutcome>("/api/flash/confirm", { changeId }, "That did not go through");
export const flashNotNow = (changeId: string) =>
  post<FlashOutcome>("/api/flash/not-now", { changeId }, "That did not go through");
export const flashRestore = (version: number, kind: "undo" | "revert") =>
  post<FlashOutcome>("/api/flash/restore", { version, kind }, "That did not go through");

export async function importHistory(file: File): Promise<string> {
  try {
    const out = await post<{ added: Record<string, number> }>("/api/history", JSON.parse(await file.text()), "Import failed");
    const a = out.added ?? {};
    return `Merged: ${a.drives ?? 0} Drives, ${a.flashes ?? 0} Flashes, ${a.installs ?? 0} Installs, ${a.answers ?? 0} answers added. Nothing was overwritten.`;
  } catch {
    return "That is not a History file I can read.";
  }
}

export const historyUrl = `${SERVER_URL}/api/history`;

/** One table of the Map version, for the 2D/3D viewer, with the checked plan's cells on it. */
export type MapTable = {
  version: number;
  table: string;
  family: string | null;
  editable_here: boolean;
  rows: number;
  cols: number;
  rpm_axis: number[];
  min: number;
  max: number;
  values: (number | string)[][];
  changes: { row: number; col: number; before: string; after: string; unit?: string }[];
};
export type MapFamily = { id: string; title: string; editable: boolean; tables: string[] };

export async function mapTable(name: string): Promise<MapTable> {
  const response = await fetch(`${SERVER_URL}/api/map/table?name=${encodeURIComponent(name)}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail ?? "That table could not be read.");
  return payload as MapTable;
}

/** The premium-fuel test: matched drives on two fuels, judged by Knock Control. */
export type FuelTest = {
  status: "measured" | "cant-tell";
  why: string | null;
  line: string;
  iatMatch: number;
  pairs: { a: string; b: string; fuelA: string; fuelB: string; iatGap: number; kcPeakA: number; kcPeakB: number; timingA: number | null; timingB: number | null }[];
};

export async function mapFamilies(): Promise<MapFamily[]> {
  const response = await fetch(`${SERVER_URL}/api/map/table`, { cache: "no-store" });
  return response.ok ? ((await response.json()) as { families: MapFamily[] }).families : [];
}

// ------------------------------------------------------------------- chats
/** One chat in the sidebar list: kept on the server like any chat app (tuning-shop D18). */
export type ChatRow = { id: string; title: string; updated_at: number; messages: number };

export async function listChats(): Promise<ChatRow[]> {
  try {
    const response = await fetch(`${SERVER_URL}/api/threads`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as { threads: ChatRow[] }).threads : [];
  } catch {
    return [];
  }
}

export async function readChat<M>(id: string): Promise<{ id: string; title: string; messages: M[] } | null> {
  try {
    const response = await fetch(`${SERVER_URL}/api/threads/${encodeURIComponent(id)}`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as { id: string; title: string; messages: M[] }) : null;
  } catch {
    return null;
  }
}

export async function saveChat(id: string, messages: unknown[]): Promise<void> {
  await fetch(`${SERVER_URL}/api/threads/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

/** The last save as the page goes away: a keepalive request the browser finishes after unload. */
export function saveChatOnLeave(id: string, messages: unknown[]): void {
  const body = JSON.stringify({ messages });
  if (body.length > 60000) return; // keepalive bodies are capped at 64 KB; the regular save has it
  void fetch(`${SERVER_URL}/api/threads/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export async function deleteChat(id: string): Promise<void> {
  await fetch(`${SERVER_URL}/api/threads/${encodeURIComponent(id)}`, { method: "DELETE" });
}
