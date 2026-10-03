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

/**
 * Which Map version this Drive ran on — always, from the first Drive.
 * `note` explains what a Map version is, on the first reply only.
 */
export type MapVersionCard = {
  line: string;
  version: number;
  name: string;
  since: number | null;
  kind: string;
  note?: string;
};

export type FlashPlan = {
  kind: "no-change" | "undo" | "one-family";
  changeId: string | null;
  family: string | null;
  headline: string;
  proof: string | null;
  saveAs: string | null;
  undoName: string | null;
  /** The Map version to flash back to, when the app knows it. */
  undo?: { known: boolean; version: number | null; name: string | null; stamp: string | null } | null;
  /** The Map version this plan is written on. */
  mapVersion?: { n: number; label: string; name: string; tablesPending?: boolean } | null;
  /** The Flash plan's own route: preset means the MAF Scaling choice. */
  route?: string | null;
  cellCount: number;
  evidence: { drives?: string[]; text: string; basis?: string }[];
  levers: { id: string; title: string; status: string; reason: string; unlocks: string }[];
  openIssues: unknown;
};

/** One tap-to-answer choice inside the reply. */
export type QuestionChoice = { id: string; label: string };

/** One owner question: what only the owner knows, asked once per Drive. */
export type OwnerQuestion = {
  id: string;
  kind: "what-changed" | "housing" | "did-flash";
  title: string;
  question: string;
  choices: QuestionChoice[];
  askedOn: string | null;
  /** The saved choice id, when answered — changeable. */
  answer: string | null;
};

/** The MAF Scaling option for one housing, inside the KTuner box. */
export type HousingOption = { housing: string; option: string | null; detail: string };

/**
 * One Open step, as the panel beside the thread reads it. `status` is the
 * engine's own word: open (Not yet), wait (Can't tell yet), fail (Still off),
 * done (proved — and then no longer Open).
 */
export type OpenStep = {
  id: string;
  key: string;
  title: string;
  status: string;
  why: string;
  askedOn: string | null;
  askedAt: number | null;
  lastAskedOn: string | null;
  settledBy: string | null;
  settledAt: number | null;
};

/** What this Drive settled about a step asked before, and the numbers behind it. */
export type SettledStep = {
  key: string;
  title: string;
  status: string;
  /** Done / Not yet / Still off / Can't tell yet — the spec's four words. */
  word: string;
  /** The pill to draw it with: good / watch / stop / none. */
  tone: string;
  why: string;
};

/** One gauge to watch while driving: TunerView's name, then OK / If you see / Then. */
export type GaugeRow = { gauge: string; ok: string; see: string; then: string };
export type GaugeTable = { columns: string[]; rows: GaugeRow[] };

/** The Drive a step asks for: numbered, short, physical. */
export type DriveRecipe = { intro: string; steps: string[] };

/** A cause seen today, told as a free habit beside the step it was seen on. */
export type AlsoStep = { key: string; title: string; why: string; steps: string[]; settlesOn: string };

export type NextStep = {
  kind: "flash" | "watch" | "drive" | "none";
  /** Which step this is, so the chat can style it: undo, baseline, habit, logger, install, downpipe… */
  key: string;
  title: string;
  body: string;
  recipe: DriveRecipe | null;
  gauges: GaugeTable | null;
  /** The same step as last time: one short line, no repeated essay. */
  same: boolean;
  proves: string;
  /** The Drive whose upload will settle it, in the owner's words. */
  upload: string;
  uploadWhen: string;
  flashPlan?: FlashPlan | null;
  also?: AlsoStep | null;
};

/** One harness step, as the collapsed row expands to. */
export type HarnessStep = {
  name: string;
  title: string;
  inputs: unknown;
  output: unknown;
  ms: number;
};

/** `Checked 8 things · 0.4 s` — the server's own count and seconds. */
export type HarnessSummary = {
  checked: number;
  seconds: number;
  line: string;
  steps: HarnessStep[];
};

/** One knowledge card the reply leans on: a quiet footnote ref, not prose. */
export type Citation = { id: string; title: string };

/** What the explainer did: checked, repaired once, or the built-in fallback. */
export type AgentInfo = {
  verified: boolean;
  repaired: boolean;
  fallback: string | null;
  citations: Citation[];
};

/** The typed reply card, read from the AG-UI STATE_SNAPSHOT. */
export type ReplyCard = {
  say: string;
  window: string;
  numbers: NumberTile[];
  mapVersion: MapVersionCard | null;
  verdict: VerdictWord;
  /** What I asked last time, settled by this Drive. */
  settled: SettledStep[];
  /** One kind line when this Drive settled nothing, else null. */
  wasted: string | null;
  flashPlan: FlashPlan | null;
  nextStep: NextStep | null;
  /** The one diagnosed cause, in one plain-words sentence — null when none. */
  cause: string | null;
  /** What only the owner knows, as tap-to-answer choices — never the model. */
  questions?: OwnerQuestion[] | null;
  /** The MAF Scaling option for the answered housing, inside the KTuner box. */
  housing?: HousingOption | null;
  /** The Open steps as they stand after this reply. */
  openSteps: OpenStep[];
  harness: HarnessSummary | null;
  /** The explainer's record, when a model wrote the sentence above. */
  agent?: AgentInfo | null;
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
