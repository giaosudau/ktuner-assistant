"use client";

/**
 * The Open steps beside the thread (above it on a phone), with the status each
 * one is at: Not yet, Can't tell yet, Still off. Below them, the questions the app
 * is waiting on — "Waiting for you" — which ticket 07 fills in; the slot is here so
 * the owner never loses one.
 */
import type { OpenStep } from "../lib/types";

export type PendingQuestion = { id: string; title: string; askedOn?: string | null; askedOnStamp?: string | null };

export function OpenStepsPanel({
  steps,
  questions,
  headline,
}: {
  steps: OpenStep[];
  questions: PendingQuestion[];
  headline?: string;
}) {
  const nothingAsked = steps.length === 0 && questions.length === 0;
  return (
    <aside className="side" data-testid="open-steps">
      <div className="card">
        <div className="eyebrow">{headline ?? "Open steps"}</div>
        {nothingAsked ? (
          <p className="muted">
            Nothing asked yet. Upload a Drive and the first thing to do appears here, with what would prove it.
          </p>
        ) : null}

        {questions.length ? (
          <ul className="asks">
            {questions.map((question) => (
              <li key={question.id} data-status="you">
                <span className="v v-watch">Waiting for you</span>
                <b>{question.title}</b>
                {question.askedOnStamp ? <span className="why">Asked on {question.askedOnStamp}.</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {steps.length ? (
          <ul className="asks">
            {steps.map((step) => {
              return (
                <li key={step.key} data-status={step.status}>
                  <span className={`v v-${step.tone}`}>{step.word}</span>
                  <b>{step.title}</b>
                  {step.why ? <span className="why">{step.why}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
