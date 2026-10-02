"use client";

/** Exactly one Next step, and the Drive whose upload will settle it. */
import type { NextStep } from "../lib/types";

const TAG: Record<NextStep["kind"], [string, string]> = {
  change: ["Change in KTuner", ""],
  flash: ["Change in KTuner", ""],
  watch: ["Watch in TunerView", ""],
  drive: ["Next drive", "drive"],
  none: ["Nothing to do", "none"],
} as Record<NextStep["kind"], [string, string]>;

export function NextStepCard({ step }: { step: NextStep | null }) {
  if (!step) return null;
  const [label, mod] = TAG[step.kind];
  return (
    <div className="next" data-testid="next-step" data-kind={step.kind}>
      <span className={`tag ${mod}`}>{label}</span>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      <div className="when">
        {step.proves && step.proves !== "nothing" ? (
          <>
            <b>The next upload proves:</b> {step.proves}.{" "}
          </>
        ) : null}
        <b>Upload:</b> {step.upload}.
      </div>
    </div>
  );
}