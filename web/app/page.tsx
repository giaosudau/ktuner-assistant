"use client";

import { useRef } from "react";

import { AskBox } from "../components/AskBox";
import { CarProfile } from "../components/CarProfile";
import { OpenStepsPanel } from "../components/OpenStepsPanel";
import { ReplyCard } from "../components/ReplyCard";
import { useThread } from "../lib/useThread";

export default function Page() {
  const { turns, busy, send, openSteps, questions, answered, carProfile, profileSpec, hasLlm, hasDrives, refreshLoop } =
    useThread();
  const picker = useRef<HTMLInputElement>(null);

  return (
    <div className="wrap">
      <header className="hero">
        <div className="eyebrow">Civic FE 1.5T CVT · KTuner Starter 21 Dual Tune 2 · E10 RON95</div>
        <h1>Upload a Drive. Is it OK, what do I do next?</h1>
        <p className="muted">
          The first line answers whether you are hurting the car, in your numbers. Then one thing to do, and the
          Drive that proves it.
        </p>
      </header>

      <div className="picker">
        <input
          ref={picker}
          type="file"
          accept=".csv,text/csv"
          data-testid="file-input"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void send(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn-upload"
          data-testid="upload"
          disabled={busy}
          onClick={() => picker.current?.click()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 11 V2.5 M4.5 6 L8 2.5 L11.5 6 M2.5 11 V13.5 H13.5 V11"
              style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}
            />
          </svg>
          {busy ? "Reading your log…" : "Upload a TunerView CSV"}
        </button>
      </div>

      {/* The Car profile sits above the thread: setup on first open, then a
          quiet card with the Install form. The Open steps sit beside the thread
          on a desktop and above it on a phone. */}
      <CarProfile
        profile={carProfile}
        spec={profileSpec}
        hasLlm={hasLlm}
        hasDrives={hasDrives}
        onSaved={() => void refreshLoop()}
      />
      <AskBox />
      <div className="layout">
        <OpenStepsPanel steps={openSteps} questions={questions} />
        <main className="thread">
          {turns.length === 0 ? (
            <p className="muted" data-testid="empty">
              Nothing uploaded yet. Pick a TunerView log from your phone or laptop.
            </p>
          ) : null}
          {turns.map((turn) => (
            <div key={turn.id} className="turn">
              <div className="up">
                <b>Uploaded</b> {turn.fileName}
              </div>
              <ReplyCard turn={turn} onAnswered={(updated) => answered(turn.id, updated)} />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
