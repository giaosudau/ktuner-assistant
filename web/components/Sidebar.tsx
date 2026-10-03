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

const JOURNEY: { id: Phase; title: string; sub: string }[] = [
  { id: "car", title: "Your car", sub: "Model, parts, fuel, the map you flashed" },
  { id: "baseline", title: "Baseline log", sub: "One Cool drive with 2 pulls" },
  { id: "read", title: "Read & decide", sub: "Is it OK, what can change" },
  { id: "plan", title: "Plan & flash", sub: "The cells to type, then flash" },
  { id: "verify", title: "Verify", sub: "The drive that proves it" },
];

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
  busy,
}: {
  loop: api.LoopState | null;
  onNewChat: () => void;
  onEditCar: () => void;
  onClose: () => void;
  onToggle: () => void;
  onFlashBasemap: () => void;
  busy: boolean;
}) {
  const phase = phaseOf(loop);
  const at = JOURNEY.findIndex((j) => j.id === phase);
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

        <div className="side-h">Tuning journey</div>
        <ol className="journey" data-testid="journey" data-phase={phase}>
          {JOURNEY.map((j, i) => (
            <li key={j.id} className={i < at ? "done" : i === at ? "now" : ""} aria-current={i === at ? "step" : undefined}>
              <span className="dot">{i < at ? <Icon name="check" className="icon" /> : null}</span>
              <span>
                {j.title}
                {i === at ? <span className="sub">{j.sub}</span> : null}
              </span>
            </li>
          ))}
        </ol>

        {waiting.length || steps.length ? <div className="side-h">Open steps</div> : null}
        <ul className="steps-list" data-testid="open-steps">
          {waiting.map((q) => (
            <li key={q.id} data-status="you">
              <Pill tone="watch" word="Waiting for you" />
              <div>{q.title}</div>
            </li>
          ))}
          {steps.map((s) => (
            <li key={s.key} data-status={s.status}>
              <Pill tone={s.tone} word={s.word} />
              <div>{s.title}</div>
            </li>
          ))}
        </ul>
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
