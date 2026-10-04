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
};

export async function readLoop(): Promise<LoopState | null> {
  try {
    const response = await fetch(`${SERVER_URL}/api/state`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as LoopState) : null;
  } catch {
    return null;
  }
}

export async function uploadCsv(file: File, threadId: string): Promise<{ uploadId: string }> {
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("threadId", threadId);
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
};

export const ask = (text: string) => post<AskAnswer>("/api/ask", { text }, "The question did not go through");

export const draftFromWords = (text: string) =>
  post<AskAnswer>("/api/ask", { text, flow: "setup" }, "I could not read that").then((out) => out.draft as ProfileDraft);

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
