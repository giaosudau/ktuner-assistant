"use client";

/** The Flash plan headline, and what would unlock each lever. */
import type { FlashPlan, HousingOption } from "../lib/types";

export function PlanCard({ plan, housing }: { plan: FlashPlan | null; housing?: HousingOption | null }) {
  if (!plan) return null;
  const locked = plan.levers.filter((lever) => lever.status === "locked" || lever.status === "held");
  const preset = plan.route === "preset";
  return (
    <div className="plan" data-testid="flash-plan">
      <div className="eyebrow" style={{ marginBottom: 2 }}>
        Flash plan
      </div>
      <div>{plan.headline}</div>
      {preset ? (
        <div data-testid="housing-route" style={{ marginTop: 6 }}>
          {housing?.option ? (
            <>
              Whenever you flash an edited map again: <b>MAF Scaling → {housing.option}</b>.{" "}
              <span className="muted">{housing.detail}</span>
            </>
          ) : housing && !housing.option ? (
            <span className="muted">{housing.detail}</span>
          ) : (
            <span className="muted">Answer which intake housing is fitted above and this box shows the MAF Scaling option.</span>
          )}
        </div>
      ) : null}
      {plan.blocked ? (
        <div className="muted" data-testid="blocked" style={{ marginTop: 4 }}>
          Checked twice before you saw it: {plan.blocked.disagree ? "the two checks disagreed" : "both checks refused it"}.
        </div>
      ) : null}
      {plan.cellCount > 0 && !plan.ktunerCard ? (
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