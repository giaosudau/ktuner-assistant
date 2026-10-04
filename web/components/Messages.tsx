"use client";

/**
 * One message in the thread. The owner's are bubbles on the right; the
 * assistant's sit on the left with no bubble, as in Claude and ChatGPT:
 *
 *   work row (what it checked, collapsible) → prose → cards → quick replies
 */
import { useState } from "react";

import type { LoopState } from "../lib/api";
import type { AiMsg, Msg, UserMsg } from "../lib/useChat";
import { sizeOf } from "../lib/useChat";
import type { CarProfile, HarnessSummary, OwnerQuestion, Picture, Turn } from "../lib/types";
import { NextStepCard, ProfileCard, QuestionCard, ReportCard, SettledCard } from "./Cards";
import { Chart } from "./Chart";
import { Icon, Mark } from "./Icons";
import type { FlashAct } from "./KTunerCard";
import { Markdown } from "./Markdown";
import { CheckpointsCard, DriveBriefCard, FuelTestCard, HealthCard, MapTourCard } from "./ShopCards";

export type Actions = {
  busy: boolean;
  loop: LoopState | null;
  onAnswer: (msgId: string, q: OwnerQuestion, choiceId: string) => void;
  onFlash: (msgId: string, ...args: Parameters<FlashAct>) => void;
  onSaveCar: (msgId: string, fields: CarProfile) => void;
  onSuggest: (text: string) => void;
  onGuide: () => void;
  onEdit: (msgId: string, text: string) => void;
  onViewTable: (table: string) => void;
};

export function UserMessage({ msg, a }: { msg: UserMsg; a: Actions }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.text);
  if (editing) {
    return (
      <div className="msg-user editing" data-testid="user-message-edit">
        <textarea
          className="edit-box"
          value={draft}
          rows={Math.min(8, Math.max(2, draft.split("\n").length))}
          aria-label="Edit your message"
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
            if (event.key === "Enter" && !event.shiftKey && draft.trim()) {
              event.preventDefault();
              setEditing(false);
              a.onEdit(msg.id, draft.trim());
            }
          }}
        />
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            data-testid="edit-send"
            disabled={!draft.trim() || a.busy}
            onClick={() => {
              setEditing(false);
              a.onEdit(msg.id, draft.trim());
            }}
          >
            Send
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="msg-user" data-testid="user-message">
      {msg.file ? (
        <div className="file-chip">
          {msg.file.thumb ? (
            <img src={msg.file.thumb} alt="" />
          ) : (
            <span className={`ficon${msg.file.kind === "csv" ? "" : " img"}`}>
              <Icon name={msg.file.kind === "csv" ? "file" : "image"} />
            </span>
          )}
          <span style={{ minWidth: 0 }}>
            <span className="fname">{msg.file.name}</span>
            <span className="fmeta">
              {msg.file.kind === "csv" ? "TunerView log" : "Screenshot"} · {sizeOf(msg.file.size)}
              {msg.file.tags ? ` · ${msg.file.tags.fuel} · map slot ${msg.file.tags.slot}` : ""}
            </span>
          </span>
        </div>
      ) : null}
      {msg.text ? <div className="bubble">{msg.text}</div> : null}
      {msg.text && !msg.file ? (
        <div className="msg-actions user-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Edit message"
            title="Edit and resend"
            data-testid="edit-message"
            disabled={a.busy}
            onClick={() => {
              setDraft(msg.text);
              setEditing(true);
            }}
          >
            <Icon name="edit" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------- the work row
const titleOf = (name: string) => {
  const t = name.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    return String(value);
  }
}

function WorkRow({ turn }: { turn: Turn }) {
  const h: HarnessSummary | null = turn.harness;
  const steps = h?.steps ?? [];
  if (turn.running) {
    return (
      <div className="work-live" data-testid="thinking" aria-live="polite">
        <span className="spinner" />
        <span className="shimmer">{turn.live ? `${titleOf(turn.live)}…` : "Reading your log…"}</span>
        {steps.length ? <span className="muted">· {steps.length} checked</span> : null}
      </div>
    );
  }
  if (!h) return null;
  const secs = h.seconds ? `${h.seconds < 10 ? h.seconds.toFixed(1) : Math.round(h.seconds)} s` : null;
  const count = h.checked || steps.length;
  return (
    <>
      <details className="work" data-testid="harness">
        <summary data-testid="harness-line">
          {secs ? `Worked for ${secs}` : "Worked"} · Checked {count} thing{count === 1 ? "" : "s"}
          <Icon name="chev" className="icon chev" />
        </summary>
        <ul className="work-list">
          {steps.map((step, i) => (
            <li key={`${step.name}-${i}`} data-step={step.name}>
              <details className="tool">
                <summary>
                  <Icon name="check" className="icon ok-tick" />
                  <span>{step.title && step.title !== step.name ? step.title : titleOf(step.name)}</span>
                  <span className="t-name">{step.name}</span>
                  {step.ms ? <span className="t-ms">{step.ms < 1000 ? `${Math.round(step.ms)} ms` : `${(step.ms / 1000).toFixed(1)} s`}</span> : null}
                </summary>
                <div className="io">
                  <figure>
                    <figcaption>Input</figcaption>
                    <pre data-io="inputs">{pretty(step.inputs)}</pre>
                  </figure>
                  <figure>
                    <figcaption>Output</figcaption>
                    <pre data-io="output">{pretty(step.output)}</pre>
                  </figure>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </details>
      {turn.thinking ? (
        <details className="think" data-testid="thinking-block">
          <summary>
            Thinking <span className="tag-unchecked">unchecked</span>
            <Icon name="chev" className="icon chev" />
          </summary>
          <pre>{turn.thinking}</pre>
        </details>
      ) : null}
    </>
  );
}

// ------------------------------------------------------------ assistant turns
function Typing({ live, count }: { live?: string; count?: number }) {
  return (
    <div className="work-live" data-testid="thinking" aria-live="polite">
      <span className="spinner" />
      <span className="shimmer">{live ? `${live}…` : "Thinking…"}</span>
      {count ? <span className="muted">· {count} checked</span> : null}
    </div>
  );
}

function DriveReply({ msg, a }: { msg: AiMsg; a: Actions }) {
  const turn = msg.turn as Turn;
  const card = turn.card;
  const say = card?.say ?? (turn.lines[0] || "");
  const pictures: Picture[] = [...(card?.pictures ?? []), ...(card?.agent?.pictures ?? [])];
  return (
    <>
      <WorkRow turn={turn} />
      {say ? (
        <div data-testid="say">
          <Markdown text={say} citations={card?.agent?.citations} />
          {card?.cause && !card?.agent?.verified ? (
            <p className="prose" data-testid="cause">
              {card.cause}
            </p>
          ) : null}
        </div>
      ) : null}
      {card?.window ? (
        <div className="basis">
          <Icon name="history" />
          {card.window}
        </div>
      ) : null}
      {card?.checkpoints?.length ? <CheckpointsCard rows={card.checkpoints} /> : null}
      {card ? <ReportCard card={card} fileName={turn.fileName} /> : null}
      {card?.health?.rows.length ? <HealthCard report={card.health} /> : null}
      {card?.fuelTest ? <FuelTestCard test={card.fuelTest} /> : null}
      {pictures.map((p, i) => (
        <Chart key={`${p.kind}-${i}`} picture={p} />
      ))}
      {card?.settled?.length ? <SettledCard rows={card.settled} /> : null}
      {card?.questions?.map((q) => (
        <QuestionCard key={q.id} question={q} busy={a.busy} onAnswer={(choice) => a.onAnswer(msg.id, q, choice)} />
      ))}
      {card?.tour ? (
        <MapTourCard tour={card.tour} plan={card.flashPlan} housing={card.housing} onAsk={a.onSuggest} onView={a.onViewTable} busy={a.busy} />
      ) : null}
      {card?.nextStep ? (
        <NextStepCard step={card.nextStep} acted={msg.acted} busy={a.busy} onFlash={(...args) => a.onFlash(msg.id, ...args)} onView={a.onViewTable} />
      ) : null}
      {turn.error ? (
        <div className="err" data-testid="reply-error">
          {turn.error}
        </div>
      ) : null}
    </>
  );
}

function Body({ msg, a }: { msg: AiMsg; a: Actions }) {
  if (msg.kind === "drive") return <DriveReply msg={msg} a={a} />;
  if (msg.pending) return <Typing live={msg.live} count={msg.liveCount} />;
  if (msg.error) return <div className="err">{msg.error}</div>;

  if (msg.kind === "profile" && msg.draft) {
    return (
      <>
        {!msg.saved ? (
          <div className="prose">
            <p>Here is your car as I understood it.</p>
          </div>
        ) : null}
        <ProfileCard draft={msg.draft} spec={a.loop?.profileSpec ?? null} saved={msg.saved} busy={a.busy} onSave={(f) => a.onSaveCar(msg.id, f)} />
      </>
    );
  }
  if (msg.kind === "ask" && msg.answer) {
    const ans = msg.answer;
    const work: Turn = {
      id: msg.id,
      fileName: "",
      running: false,
      card: null,
      lines: [],
      harness: ans.harness ?? null,
      thinking: ans.thinking ?? undefined,
    };
    return (
      <>
        <WorkRow turn={work} />
        <div data-testid="ask-answer">
          <Markdown text={ans.answer ?? "I have no answer to that yet."} citations={ans.citations} />
        </div>
        {(ans.pictures ?? []).map((p, i) => (
          <Chart key={`${p.kind}-${i}`} picture={p} />
        ))}
        {ans.window && ans.window !== "nothing read yet" ? (
          <div className="basis" data-testid="ask-window">
            <Icon name="history" />
            {ans.window}
          </div>
        ) : null}
        {ans.kind === "no-drive" ? (
          <div className="chips">
            <button type="button" className="chip" onClick={a.onGuide}>
              <Icon name="route" />
              How should I log a drive?
            </button>
          </div>
        ) : null}
      </>
    );
  }
  if (msg.kind === "answer" && msg.result) {
    const r = msg.result;
    return (
      <>
        <div className="prose">
          <p>Got it. {r.cause ? r.cause : "Here is the next step with your answer applied."}</p>
          {r.housing?.option ? (
            <p>
              Whenever you flash an edited map again: <b>MAF Scaling → {r.housing.option}</b>. {r.housing.detail}
            </p>
          ) : r.housing?.detail ? (
            <p>{r.housing.detail}</p>
          ) : null}
        </div>
        {r.questions
          ?.filter((q) => !q.answer)
          .map((q) => (
            <QuestionCard key={q.id} question={q} busy={a.busy} onAnswer={(choice) => a.onAnswer(msg.id, q, choice)} />
          ))}
        {r.nextStep ? (
          <NextStepCard step={r.nextStep} acted={msg.acted} busy={a.busy} onFlash={(...args) => a.onFlash(msg.id, ...args)} onView={a.onViewTable} />
        ) : null}
      </>
    );
  }
  if (msg.kind === "flash" && msg.outcome) {
    return (
      <>
        <div className="prose" data-testid="flash-outcome">
          <p className="lead">{msg.outcome.line}</p>
          {msg.outcome.next ? (
            <p>
              {msg.outcome.next} Log it in TunerView as usual and attach it here when you&apos;re back: I&apos;ll read it against the map
              you just flashed.
            </p>
          ) : null}
        </div>
      </>
    );
  }
  if (msg.kind === "note") {
    return (
      <>
        <div className="prose">
          {msg.text ? <p className="lead">{msg.text}</p> : null}
          {msg.detail ? <p>{msg.detail}</p> : null}
        </div>
        {msg.guide ? <DriveBriefCard brief={a.loop?.logGuide} /> : null}
      </>
    );
  }
  return null;
}

/** Quick replies under the latest assistant message only, as in ChatGPT. */
function Suggestions({ msg, a }: { msg: AiMsg; a: Actions }) {
  const step = msg.turn?.card?.nextStep ?? msg.result?.nextStep;
  const items: { label: string; run: () => void; icon: string }[] = [];
  if (msg.kind === "drive" && msg.turn?.card) {
    if (step && step.kind !== "none") items.push({ label: "Why this step?", icon: "help", run: () => a.onSuggest(`Why is "${step.title}" my next step?`) });
    items.push({ label: "What's safe to change on my car?", icon: "wrench", run: () => a.onSuggest("What is safe to change in my map right now, and what would unlock more?") });
    items.push({ label: "How do I log the next drive?", icon: "route", run: a.onGuide });
  }
  if (!items.length) return null;
  return (
    <div className="chips" data-testid="suggestions">
      {items.map((s) => (
        <button key={s.label} type="button" className="chip" disabled={a.busy} onClick={s.run}>
          <Icon name={s.icon} />
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function AssistantMessage({ msg, latest, a }: { msg: AiMsg; latest: boolean; a: Actions }) {
  const [copied, setCopied] = useState(false);
  const text = msg.turn?.card?.say ?? msg.answer?.answer ?? msg.outcome?.line ?? msg.text ?? "";
  const done = !msg.pending && !msg.turn?.running;
  return (
    <div className={`msg-ai${latest ? " latest" : ""}`} data-testid="assistant-message" data-kind={msg.kind}>
      <span className="avatar" aria-hidden="true">
        <Mark />
      </span>
      <div className="ai-body">
        <Body msg={msg} a={a} />
        {done && latest ? <Suggestions msg={msg} a={a} /> : null}
        {done && text ? (
          <div className="msg-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={copied ? "Copied" : "Copy"}
              title={copied ? "Copied" : "Copy"}
              onClick={() => {
                void navigator.clipboard?.writeText(text.replace(/\s*\[[a-z0-9-]+\]/g, ""));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Icon name={copied ? "check" : "copy"} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Message({ msg, latest, a }: { msg: Msg; latest: boolean; a: Actions }) {
  return msg.role === "user" ? <UserMessage msg={msg} a={a} /> : <AssistantMessage msg={msg} latest={latest} a={a} />;
}
