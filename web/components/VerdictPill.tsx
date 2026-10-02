"use client";

/** The Verdict word: OK, Watch, Stop or Can't tell — and nothing for a Too-short drive. */
import type { VerdictWord } from "../lib/types";

const CLASS: Record<string, string> = {
  OK: "v-good",
  Watch: "v-watch",
  Stop: "v-stop",
  "Can't tell": "v-none",
};

export function VerdictPill({ verdict }: { verdict: VerdictWord }) {
  if (!verdict) return null;
  return (
    <span className={`v ${CLASS[verdict] ?? "v-none"}`} data-testid="verdict" data-verdict={verdict}>
      {verdict}
    </span>
  );
}