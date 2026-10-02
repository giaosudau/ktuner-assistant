"use client";

/**
 * One reply, in the order the owner reads it:
 *
 *   the sentence that answers "am I hurting it?" · the window it read ·
 *   the four numbers · the Verdict word · the Flash plan headline ·
 *   the collapsed harness steps · exactly one Next step.
 */
import type { Turn } from "../lib/types";

import { HarnessSteps } from "./HarnessSteps";
import { NextStepCard } from "./NextStepCard";
import { NumberRow } from "./NumberRow";
import { PlanCard } from "./PlanCard";
import { VerdictPill } from "./VerdictPill";

export function ReplyCard({ turn }: { turn: Turn }) {
  const card = turn.card;
  const say = card?.say ?? turn.lines[0] ?? "";
  const window = card?.window ?? turn.lines[1] ?? "";

  return (
    <div className="card reply" data-testid="reply-card">
      <div className="head-row">
        <span className="eyebrow">{turn.fileName}</span>
        {card ? <VerdictPill verdict={card.verdict} /> : null}
      </div>

      {say ? (
        <div className="say" data-testid="say">
          {say}
        </div>
      ) : null}
      {window ? <div className="window">{window}</div> : null}

      {turn.running && !card ? (
        <div className="dots" data-testid="thinking">
          <i />
          <i />
          <i />
        </div>
      ) : null}

      {card?.numbers ? <NumberRow tiles={card.numbers} /> : null}
      {card?.flashPlan ? <PlanCard plan={card.flashPlan} /> : null}
      {turn.harness ? <HarnessSteps harness={turn.harness} /> : null}
      {card?.nextStep ? <NextStepCard step={card.nextStep} /> : null}

      {turn.error ? (
        <div className="err" data-testid="reply-error">
          {turn.error}
        </div>
      ) : null}
    </div>
  );
}