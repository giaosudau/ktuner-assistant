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

/** One cell to type into KTuner: the rpm row, the column "N of 16", before and after as KTuner shows them. */
export type KTunerCell = {
  id: string;
  rpm: number;
  row: string;
  col: number;
  of: number;
  column: string;
  before: string;
  after: string;
  unit: string;
};

/** Tables that carry the identical cells (the six Normal boost tables), read as one. */
export type KTunerGroup = {
  tables: string[];
  unit: string;
  what: string;
  effect: string;
  same: boolean;
  pasteRow: string | null;
  cells: KTunerCell[];
};

/** The KTuner card, drawn only from the change both map checks passed. */
export type KTunerCard = {
  kind: "change";
  changeId: string;
  family: string;
  headline: string;
  because: string;
  writtenOn: string;
  groups: KTunerGroup[];
  cellCount: number;
  tableCount: number;
  saveAs: string;
  undo: { known: boolean; version: number | null; line: string | null };
  proof: string | null;
  afterFlash: string;
  /** Can the log read this change back? Said per table family. */
  readback: { possible: boolean; line: string };
  checked: string;
};

/** Undo is a file to load and flash back, not cells to type. */
export type UndoCard = {
  kind: "undo";
  changeId: null;
  headline: string;
  restore: { version: number; name: string; line: string };
  proof: string | null;
  afterFlash: string;
};

export type FlashPlan = {
  kind: "no-change" | "undo" | "one-family" | "blocked";
  /** The checked change as a card; null when nothing is offered to type. */
  ktunerCard?: KTunerCard | UndoCard | null;
  /** Why a change was refused, in plain words. */
  blocked?: { reason: string; why: string; disagree: boolean } | null;
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
  /** The status word and pill tone, worded by the engine (the server passes them through). */
  word: string;
  tone: string;
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

/**
 * A picture the engine made the data for (ticket 15); the chat only draws it.
 * Every number it prints is also in the reply text.
 */
export type Picture =
  | { kind: "cant-tell"; title: string; why: string }
  | { kind: "baseline" | "proof"; title: string; unit: string; bars: { label: string; value: number }[]; note?: string }
  | {
      kind: "trace";
      title: string;
      unit: string;
      series: { name: string; points: [number, number][] }[];
      moment: { at: number; label: string };
    }
  | {
      kind: "map_grid";
      title: string;
      tables: string[];
      rpm: number[];
      cols: number;
      changes: { row: number; col: number; before: number; after: number; rpm: number }[];
      driven: number[];
      unit: string;
    }
  | { kind: "maf_gap"; title: string; x: number[]; before: number[]; after: number[]; gapPct: number; unit: string };

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
  /** Flash readback on a Drive after a Flash; null when no Flash is being read back. */
  readback?: { state: "credited" | "mismatch" | "open" | "not-possible"; credited: boolean | null; line: string } | null;
  /** The one diagnosed cause, in one plain-words sentence — null when none. */
  cause: string | null;
  /** What only the owner knows, as tap-to-answer choices — never the model. */
  questions?: OwnerQuestion[] | null;
  /** The MAF Scaling option for the answered housing, inside the KTuner box. */
  housing?: HousingOption | null;
  /** The Open steps as they stand after this reply. */
  openSteps: OpenStep[];
  harness: HarnessSummary | null;
  /** At most one picture, plus the map grid when the step is a Flash. */
  pictures?: Picture[] | null;
  /** The explainer's record, when a model wrote the sentence above. */
  agent?: (AgentInfo & { pictures?: Picture[] | null; thinking?: string | null }) | null;
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
  /** The model's own words while it worked: shown apart, labelled unchecked. */
  thinking?: string;
  /** The tool running right now, for the live work row. */
  live?: string;
};

/** The Car profile: the owner's one car as the app knows it (CONTEXT.md). */
export type CarProfileFields = {
  model: string;
  engine: string;
  transmission: string;
  fuel: string;
  climate: string;
  basemap: string;
  parts: string[];
};

export type CarProfile = CarProfileFields;

/** The plain form's fields: the same fields the filled card shows. */
export type ProfileSpec = {
  fields: string[];
  parts: string[];
  basemap: string;
  basemapNote: string;
};

/** The filled card before confirm: what came from the owner's words. */
export type ProfileDraft = {
  fields: CarProfileFields;
  filled: Record<string, boolean>;
  missing: string[];
  prefilled: string[];
};

/** An Install: a part fitted or removed, with its date (CONTEXT.md). */
export type InstallRow = {
  id: string;
  installed_at: number;
  part: string;
  action: string;
  note: string;
};

/** The drive window: the Drives an answer is about, and the line that says so. */
export type DriveWindow = {
  driveIds: string[];
  count: number;
  since: { kind: string; label: string; day: string } | null;
  line: string;
};

export const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_URL ?? "http://127.0.0.1:8000/agent";
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://127.0.0.1:8000";
