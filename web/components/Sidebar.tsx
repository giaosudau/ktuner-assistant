"use client";

/**
 * The sidebar mirrors the loop, it never runs it: the car, where the owner is in
 * the tuning journey, what is still open, and the History file. Everything the
 * owner *does* happens in the thread.
 */
import { useRef, useState } from "react";

import * as api from "../lib/api";
import { Icon, Mark } from "./Icons";
import { Pill } from "./Pill";

type Phase = "car" | "baseline" | "read" | "plan" | "verify";

/** A round at the shop: log the brief, read it, change and flash, prove it with the next log. */
const STAGES: { id: string; title: string }[] = [
  { id: "log", title: "Log" },
  { id: "read", title: "Read" },
  { id: "change", title: "Change & flash" },
  { id: "prove", title: "Prove it" },
];
const STAGE_OF: Record<Phase, number> = { car: -1, baseline: 0, read: 1, plan: 2, verify: 3 };
const NEED: Record<Phase, string> = {
  car: "Tell me about your car in the chat: model, gearbox, fuel, parts and the KTuner map you flashed.",
  baseline: "Drive the brief (one cool drive with 2 pulls) and attach the TunerView log.",
  read: "Read your report and ask me anything about it. When you're ready, drive the next step and attach the log.",
  plan: "Type the change into KTuner, flash it, and tell me here you flashed it.",
  verify: "Drive the Shakedown: 10 calm minutes, no hard driving. Then attach the log so I can check the car runs what you flashed.",
};

/** Where the owner is, read from the loop the server holds — never guessed from the thread. */
export function phaseOf(loop: api.LoopState | null): Phase {
  if (!loop?.carProfile) return "car";
  if (!loop.hasDrives) return "baseline";
  const lastDrive = Math.max(0, ...loop.carHistory.map((r) => r.start ?? 0));
  const lastFlash = Math.max(0, ...loop.flashes.map((f) => f.flashed_at ?? f.time ?? 0));
  if (lastFlash > lastDrive) return "verify";
  const kind = loop.flashPlan?.kind;
  if (kind === "one-family" || kind === "undo") return "plan";
  if (loop.openSteps.some((s) => s.key === "baseline")) return "baseline";
  return "read";
}

const PARTS: Record<string, string> = { "front-pipe": "front pipe", "cvt-cooler": "CVT cooler" };
export const partName = (p: string) => PARTS[p] ?? p;

export function Sidebar({
  loop,
  onNewChat,
  onEditCar,
  onClose,
  onToggle,
  onFlashBasemap,
  onGuide,
  busy,
}: {
  loop: api.LoopState | null;
  onNewChat: () => void;
  onEditCar: () => void;
  onClose: () => void;
  onToggle: () => void;
  onFlashBasemap: () => void;
  onGuide: () => void;
  busy: boolean;
}) {
  const phase = phaseOf(loop);
  const stageAt = STAGE_OF[phase];
  const car = loop?.carProfile;
  const active = loop?.activeMapVersion;
  const picker = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const waiting = loop?.unansweredQuestions ?? [];
  const steps = loop?.openSteps ?? [];

  return (
    <aside className="side" aria-label="Your car and the tuning journey" data-testid="sidebar">
      <div className="side-top">
        <div className="brand">
          <span className="brand-mark">
            <Mark />
          </span>
          KTuner Assistant
        </div>
        <button type="button" className="icon-btn" aria-label="Close sidebar" onClick={onToggle}>
          <Icon name="panel" />
        </button>
      </div>
      <nav className="side-nav">
        <button
          type="button"
          className="side-item"
          data-testid="new-chat"
          onClick={() => {
            onNewChat();
            onClose();
          }}
        >
          <Icon name="newchat" />
          New chat
        </button>
      </nav>

      <div className="side-scroll">
        <div className="side-h">Your car</div>
        <div className="car-sum" data-testid="car-summary">
          {car ? (
            <>
              <b>{[car.model, car.transmission].filter(Boolean).join(" · ")}</b>
              <span className="muted" style={{ display: "block" }}>{[car.fuel, car.climate].filter(Boolean).join(" · ")}</span>
              {car.parts.length ? (
                <span className="muted" style={{ display: "block" }}>
                  Parts: {car.parts.map(partName).join(", ")}
                </span>
              ) : null}
            </>
          ) : (
            <span className="muted">Not set up yet. Tell me about your car in the chat.</span>
          )}
          {active ? (
            <div className="map-pill" data-testid="active-map" title={`${active.label} · ${active.name}`}>
              <Icon name="file" className="icon" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {active.label} · {active.name}
              </span>
            </div>
          ) : null}
          {car ? (
            <button
              type="button"
              className="side-item"
              data-testid="profile-edit"
              disabled={busy}
              onClick={() => {
                onEditCar();
                onClose();
              }}
            >
              <Icon name="edit" />
              Edit car or parts
            </button>
          ) : null}
          {active && active.n !== 1 ? (
            <button type="button" className="side-item" data-testid="revert" disabled={busy} onClick={onFlashBasemap}>
              <Icon name="undo" />
              I flashed the KTuner basemap
            </button>
          ) : null}
        </div>

        <div className="side-h">This round</div>
        <div className="round" data-testid="journey" data-phase={phase}>
          <div className="round-h">
            Round {(loop?.flashes.length ?? 0) + 1}
            <span className="muted"> · on {active ? active.label : "Map version 1"}</span>
          </div>
          <ol className="stages" aria-label="Where this round is">
            {STAGES.map((stage, i) => (
              <li key={stage.id} className={i < stageAt ? "done" : i === stageAt ? "now" : ""} aria-current={i === stageAt ? "step" : undefined}>
                <span className="bar" />
                <span className="name">{stage.title}</span>
              </li>
            ))}
          </ol>
          <div className="need" data-testid="need">
            <b>What I need from you</b>
            <span>{NEED[phase]}</span>
            {phase === "baseline" || phase === "verify" || phase === "read" ? (
              <button type="button" className="btn ghost" data-testid="show-brief" onClick={() => { onGuide(); onClose(); }} disabled={busy}>
                <Icon name="route" />
                Show the drive brief
              </button>
            ) : null}
          </div>
        </div>

        {waiting.length ? (
          <>
            <div className="side-h">Waiting for your answer</div>
            <ul className="steps-list" data-testid="waiting">
              {waiting.map((q) => (
                <li key={q.id} data-status="you">
                  <div className="st-title">{q.title}</div>
                  <div className="st-why">Answer it in the reply where I asked.</div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {steps.length ? (
          <>
            <div className="side-h">Your next drive can settle</div>
            <ul className="steps-list" data-testid="open-steps">
              {steps.map((st) => (
                <li key={st.key} data-status={st.status}>
                  <div className="st-title">
                    {st.title} <Pill tone={st.tone} word={st.word} />
                  </div>
                  {st.why ? <div className="st-why">{st.why}</div> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="side-foot">
        <a className="side-item" href={api.historyUrl} download="ktuner-history.json" data-testid="export-history">
          <Icon name="download" />
          Export History file
        </a>
        <button type="button" className="side-item" onClick={() => picker.current?.click()}>
          <Icon name="upload" />
          Import History file
        </button>
        <input
          ref={picker}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="import-history"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) setNote(await api.importHistory(file));
          }}
        />
        {note ? (
          <p className="side-note" role="status">
            {note}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
