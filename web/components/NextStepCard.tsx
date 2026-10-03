"use client";

/**
 * Exactly one Next step, the Drive whose upload will settle it, and — when the
 * step asks for a Drive or a set of gauges — the recipe and the gauge table.
 *
 * The gauge table is four columns (the gauge as TunerView spells it, OK, If you
 * see, Then). Four columns do not fit a phone, so each gauge is one stacked row
 * there and the table widens into columns on a desktop.
 */
import type { GaugeTable, NextStep } from "../lib/types";

const TAG: Record<NextStep["kind"], [string, string]> = {
  change: ["Change in KTuner", ""],
  flash: ["Change in KTuner", ""],
  watch: ["Watch in TunerView", ""],
  drive: ["Next drive", "drive"],
  none: ["Nothing to do", "none"],
} as Record<NextStep["kind"], [string, string]>;

function GaugeTableView({ table }: { table: GaugeTable }) {
  return (
    <div className="gauges" data-testid="gauges">
      <div className="gauge-head" aria-hidden="true">
        {table.columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {table.rows.map((row) => (
        <div className="gauge" key={row.gauge} data-gauge={row.gauge}>
          <b className="g-name">{row.gauge}</b>
          <span className="g-cell">
            <i>OK</i>
            {row.ok}
          </span>
          <span className="g-cell">
            <i>If you see</i>
            {row.see}
          </span>
          <span className="g-cell">
            <i>Then</i>
            {row.then}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NextStepCard({ step }: { step: NextStep | null }) {
  if (!step) return null;
  const [label, mod] = TAG[step.kind];
  return (
    <div
      className={`next${step.same ? " same" : ""}`}
      data-testid="next-step"
      data-kind={step.kind}
      data-key={step.key}
    >
      <span className={`tag ${mod}`}>{label}</span>
      {step.same ? <span className="muted same-note">Same step as last time.</span> : null}
      <h3>{step.title}</h3>

      {step.body ? <p>{step.body}</p> : null}

      {step.recipe && step.recipe.steps.length ? (
        <>
          <div className="eyebrow recipe-head">
            {step.kind === "drive" ? "The Drive to log" : "What to do"}
          </div>
          <ol className="recipe">
            {step.recipe.steps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </>
      ) : null}

      {step.gauges && step.gauges.rows.length ? (
        <>
          <div className="eyebrow recipe-head">Watch live while you drive</div>
          <GaugeTableView table={step.gauges} />
        </>
      ) : null}

      {step.also ? (
        <div className="also" data-testid="also-seen">
          <b>{step.also.title}</b>
          {step.also.why ? <p>{step.also.why}</p> : null}
          {step.also.steps.length ? (
            <ol className="recipe">
              {step.also.steps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : null}
          <div className="muted">Upload when: {step.also.settlesOn}.</div>
        </div>
      ) : null}

      <div className="when">
        {step.proves && step.proves !== "nothing" ? (
          <>
            <b>The next upload proves:</b> {step.proves}.{" "}
          </>
        ) : null}
        <b>Upload when:</b> {step.upload}.
      </div>
    </div>
  );
}
