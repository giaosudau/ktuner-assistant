"use client";

/**
 * "What I asked last time" — every Open step this Drive settled, with the reason
 * and the numbers behind it. Four words only: Done, Not yet, Still off, Can't tell
 * yet. "Can't tell yet" always says why (too short, too cool, a dead gauge), so it
 * never reads as a failure.
 */
import type { SettledStep } from "../lib/types";

export function SettledSteps({ rows }: { rows: SettledStep[] }) {
  if (!rows.length) return null;
  return (
    <div className="settled" data-testid="settled">
      <div className="eyebrow">What I asked last time</div>
      {rows.map((row) => (
        <div className="row" key={row.key} data-status={row.status}>
          <span className={`v v-${row.tone}`}>{row.word}</span>
          <span>
            <b>{row.title}.</b> {row.why}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WastedLine({ line }: { line: string | null }) {
  if (!line) return null;
  return (
    <p className="wasted" data-testid="wasted">
      {line}
    </p>
  );
}
