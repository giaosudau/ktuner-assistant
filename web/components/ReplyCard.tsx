"use client";

/**
 * One reply, in the order the owner reads it:
 *
 *   the sentence that answers "am I hurting it?" · the one diagnosed cause ·
 *   the window it read · the four numbers · the Map version this Drive ran on ·
 *   what I asked last time (settled, with the reason) · whether this Drive was a Wasted one ·
 *   the Verdict word · the Flash plan headline · the collapsed harness steps ·
 *   exactly one Next step with its recipe or gauge table.
 */
import type { OwnerQuestion, ReplyCard as ReplyCardType, Turn } from "../lib/types";

import { CitedSay } from "./Citations";
import { HarnessSteps } from "./HarnessSteps";
import { MapVersionLine } from "./MapVersionLine";
import { NextStepCard } from "./NextStepCard";
import { NumberRow } from "./NumberRow";
import { PlanCard } from "./PlanCard";
import { QuestionCard } from "./QuestionCard";
import { SettledSteps, WastedLine } from "./SettledSteps";
import { VerdictPill } from "./VerdictPill";

export function ReplyCard({
  turn,
  onAnswered,
}: {
  turn: Turn;
  onAnswered?: (updated: {
    questions: ReplyCardType["questions"];
    nextStep: ReplyCardType["nextStep"];
    housing: ReplyCardType["housing"];
    unansweredQuestions: { id: string; title: string; askedOn?: string | null }[];
  }) => void;
}) {
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
          <CitedSay say={say} citations={card?.agent?.citations} />
        </div>
      ) : null}
      {card?.cause ? (
        <div className="cause" data-testid="cause">
          {card.cause}
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
      {card?.mapVersion ? <MapVersionLine card={card.mapVersion} /> : null}
      {card?.settled ? <SettledSteps rows={card.settled} /> : null}
      <WastedLine line={card?.wasted ?? null} />
      {card?.readback ? (
        <p className={`readback ${card.readback.state}`} data-testid="readback">
          {card.readback.line}
        </p>
      ) : null}
      {card?.flashPlan ? <PlanCard plan={card.flashPlan} housing={card.housing ?? null} /> : null}
      {card?.questions?.map((question) => (
        <QuestionCard key={question.id} question={question} onAnswered={onAnswered} />
      ))}
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
