"use client";

/**
 * The Open steps beside the thread (above it on a phone), with the status each
 * one is at: Not yet, Can't tell yet, Still off. Below them, the questions the app
 * is waiting on — "Waiting for you" — which ticket 07 fills in; the slot is here so
 * the owner never loses one.
 */
import type { OpenStep } from "../lib/types";

const STATUS: Record<string, [string, string]> = {
  open: ["Not yet", "watch"],
  wait: ["Can't tell yet", "none"],
  fail: ["Still off", "stop"],
  done: ["Done", "good"],
};

/** `20260830-160151` → `30 Aug 16:01`, the spelling the owner knows. */
function driveStamp(id: string | null): string {
  if (!id || id.length < 15) return "";
  const day = id.slice(6, 8);
  const month = id.slice(4, 6);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[Number(month) - 1] ?? ""} ${id.slice(9, 11)}:${id.slice(11, 13)}`;
}

export type PendingQuestion = { id: string; title: string; askedOn?: string | null };

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
                {question.askedOn ? <span className="why">Asked on {driveStamp(question.askedOn)}.</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {steps.length ? (
          <ul className="asks">
            {steps.map((step) => {
              const [word, tone] = STATUS[step.status] ?? ["Not yet", "watch"];
              return (
                <li key={step.key} data-status={step.status}>
                  <span className={`v v-${tone}`}>{word}</span>
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
