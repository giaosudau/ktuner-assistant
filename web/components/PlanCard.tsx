"use client";

/** The Flash plan headline, and what would unlock each lever. */
import type { FlashPlan } from "../lib/types";

export function PlanCard({ plan }: { plan: FlashPlan | null }) {
  if (!plan) return null;
  const locked = plan.levers.filter((lever) => lever.status === "locked" || lever.status === "held");
  return (
    <div className="plan" data-testid="flash-plan">
      <div className="eyebrow" style={{ marginBottom: 2 }}>
        Flash plan
      </div>
      <div>{plan.headline}</div>
      {plan.cellCount > 0 ? (
        <div className="muted" style={{ marginTop: 4 }}>
          {plan.cellCount} cell{plan.cellCount === 1 ? "" : "s"} · save as {plan.saveAs ?? "—"}
        </div>
      ) : null}
      {locked.length ? (
        <details style={{ marginTop: 8 }}>
          <summary className="muted" style={{ cursor: "pointer", minHeight: 32 }}>
            What is locked, and what unlocks it
          </summary>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "var(--ink-2)", fontSize: 13 }}>
            {locked.map((lever) => (
              <li key={lever.id}>
                <b>{lever.title}</b> — {lever.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}