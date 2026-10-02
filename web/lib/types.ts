/**
 * The types the server sends, written once so every card reads the same shape.
 *
 * Nothing here is invented in the browser: every number came from the engine
 * through the Node worker, and the cards only lay it out.
 */

/** The four numbers, in the order CONTEXT.md fixes. */
export type NumberTile = { label: string; value: string; unit: string };

/** OK | Watch | Stop | Can't tell — and null for a Too-short drive. */
export type VerdictWord = "OK" | "Watch" | "Stop" | "Can't tell" | null;

export type FlashPlan = {
  kind: "no-change" | "undo" | "one-family";
  changeId: string | null;
  family: string | null;
  headline: string;
  proof: string | null;
  saveAs: string | null;
  undoName: string | null;
  cellCount: number;
  evidence: { drives?: string[]; text: string; basis?: string }[];
  levers: { id: string; title: string; status: string; reason: string; unlocks: string }[];
  openIssues: unknown;
};

export type NextStep = {
  kind: "flash" | "watch" | "drive" | "none";
  title: string;
  body: string;
  proves: string;
  upload: string;
  flashPlan?: FlashPlan | null;
};

/** One harness step, as the collapsed row expands to. */
export type HarnessStep = {
  name: string;
  title: string;
  inputs: unknown;
  output: unknown;
  ms: number;
};

/** `Checked 6 things · 4.2 s` — the server's own count and seconds. */
export type HarnessSummary = {
  checked: number;
  seconds: number;
  line: string;
  steps: HarnessStep[];
};

/** The typed reply card, read from the AG-UI STATE_SNAPSHOT. */
export type ReplyCard = {
  say: string;
  window: string;
  numbers: NumberTile[];
  verdict: VerdictWord;
  flashPlan: FlashPlan | null;
  nextStep: NextStep | null;
  harness: HarnessSummary | null;
  error?: { message: string; code: string };
};

export type DriveSummary = {
  id: string;
  tooShort: boolean;
  verdict: string;
  fileName?: string;
  summary: {
    start: number | null;
    iatMoving: number | null;
    kcStart: number | null;
    kcPeak: number | null;
    timingCostDeg: number | null;
    trimWorst: number | null;
    hardPulls: number | null;
    cool: boolean;
  } | null;
};

export type LoopState = {
  upload_id?: string;
  thread_id?: string;
  drive?: DriveSummary;
  reply?: ReplyCard;
  error?: { message: string; code: string };
};

/** One turn in the thread, as the owner reads it. */
export type Turn = {
  id: string;
  fileName: string;
  running: boolean;
  error?: string;
  card: ReplyCard | null;
  harness: HarnessSummary | null;
  lines: string[];
};

export const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_URL ?? "http://127.0.0.1:8000/agent";
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://127.0.0.1:8000";