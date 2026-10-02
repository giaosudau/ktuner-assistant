"use client";

/**
 * The harness line: one collapsed row, `Checked 6 things · 4.2 s`, expanding to
 * each step with its tool inputs and outputs. Trust is the point — the owner has
 * to be able to check the work.
 */
import type { HarnessSummary } from "../lib/types";

export function HarnessSteps({ harness }: { harness: HarnessSummary | null }) {
  if (!harness) return null;
  return (
    <details className="harness" data-testid="harness">
      <summary data-testid="harness-line">{harness.line}</summary>
      <ul className="steps">
        {harness.steps.map((step, i) => (
          <li className="step-row" key={`${step.name}-${i}`} data-step={step.name}>
            <details>
              <summary>
                {i + 1}. {step.title || step.name}
              </summary>
              <div className="io">
                <figure>
                  <figcaption>Tool inputs</figcaption>
                  <pre data-io="inputs">{pretty(step.inputs)}</pre>
                </figure>
                <figure>
                  <figcaption>Tool output</figcaption>
                  <pre data-io="output">{pretty(step.output)}</pre>
                </figure>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </details>
  );
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    return String(value);
  }
}