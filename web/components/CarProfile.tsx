"use client";

/**
 * The Car profile in the chat: setup in about a minute, then a quiet card.
 *
 * First open, the chat asks the owner to describe the car in their own words
 * (with an example). The card fills from it; the owner corrects any field and
 * confirms — nothing is saved before confirm. With no key there is no card to
 * fill, so the same fields show as a plain form (`profileSpec`). Afterwards
 * the card sits quiet above the thread, with an edit and a fitted-or-removed
 * part form: either records an Install with its date.
 *
 * With no Drive at all only this setup runs; a typed tuning question is
 * answered with "upload a drive first".
 */
import { useState } from "react";

import {
  askWithoutDrive,
  draftProfile,
  recordInstall,
  saveProfile,
} from "../lib/useThread";
import type {
  CarProfile as CarProfileType,
  InstallRow,
  ProfileDraft,
  ProfileSpec,
} from "../lib/types";

const SCALARS = ["model", "engine", "transmission", "fuel", "climate", "basemap"] as const;
const LABELS: Record<string, string> = {
  model: "Model",
  engine: "Engine",
  transmission: "Transmission",
  fuel: "Fuel",
  climate: "Climate",
  basemap: "KTuner basemap",
};

const EXAMPLE =
  "Civic FE 1.5T CVT on E10 RON95 in hot traffic — intake, downpipe, front pipe, catback, big intercooler, CVT cooler.";

function emptyFields(spec: ProfileSpec | null): CarProfileType {
  return {
    model: "",
    engine: "",
    transmission: "",
    fuel: "",
    climate: "",
    basemap: spec?.basemap ?? "",
    parts: [],
  };
}

function partName(part: string): string {
  return { "front-pipe": "front pipe", "cvt-cooler": "CVT cooler" }[part] ?? part;
}

function todayInput(): string {
  const now = new Date();
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function CarProfile({
  profile,
  spec,
  hasLlm,
  hasDrives,
  onSaved,
}: {
  profile: CarProfileType | null;
  spec: ProfileSpec | null;
  hasLlm: boolean;
  hasDrives: boolean;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [fields, setFields] = useState<CarProfileType | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLine, setSavedLine] = useState<string | null>(null);
  const [savedInstalls, setSavedInstalls] = useState<InstallRow[]>([]);
  const [asked, setAsked] = useState<string | null>(null);
  const [askText, setAskText] = useState("");
  const [installPart, setInstallPart] = useState("");
  const [installAction, setInstallAction] = useState("fitted");
  const [installDate, setInstallDate] = useState(todayInput());
  const [installLine, setInstallLine] = useState<string | null>(null);

  async function fill() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const filled = await draftProfile(text);
      setDraft(filled);
      setFields({ ...filled.fields, parts: [...filled.fields.parts] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function startForm() {
    setError(null);
    setFields(profile ? { ...profile, parts: [...profile.parts] } : emptyFields(spec));
    setEditing(true);
  }

  async function confirm() {
    if (!fields || busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await saveProfile(fields);
      setSavedLine(out.line);
      setSavedInstalls(out.installs);
      setDraft(null);
      setFields(null);
      setText("");
      setEditing(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function togglePart(part: string) {
    setFields((prev) => {
      if (!prev) return prev;
      const parts = prev.parts.includes(part) ? prev.parts.filter((p) => p !== part) : [...prev.parts, part];
      return { ...prev, parts };
    });
  }

  async function ask() {
    if (!askText.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await askWithoutDrive(askText);
      setAsked(out.answer ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function record() {
    if (!installPart || busy) return;
    setBusy(true);
    setError(null);
    try {
      const at = new Date(`${installDate}T12:00:00+07:00`).getTime();
      const out = await recordInstall(installPart, installAction, Number.isFinite(at) ? at : Date.now());
      setInstallLine(out.line);
      setInstallPart("");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // -- the saved card: one quiet line, with an edit and a part form ---------
  if (profile && !editing) {
    const bits = [profile.model, profile.transmission, profile.fuel, profile.climate].filter(Boolean);
    return (
      <section className="card setup" data-testid="profile-card">
        <div className="eyebrow">Car profile</div>
        <p className="setup-line">
          {bits.join(" · ")}
          {profile.parts.length ? ` · ${profile.parts.map(partName).join(", ")}` : ""}
        </p>
        <div className="setup-row">
          <button type="button" className="link" data-testid="profile-edit" onClick={() => void startForm()}>
            Correct it
          </button>
        </div>
        <div className="setup-install" data-testid="install-form">
          <span className="muted">Fitted or removed a part?</span>
          <div className="setup-row">
            <select
              aria-label="Part"
              data-testid="install-part"
              value={installPart}
              onChange={(event) => setInstallPart(event.target.value)}
            >
              <option value="">Part…</option>
              {(spec?.parts ?? []).map((part) => (
                <option key={part} value={part}>
                  {partName(part)}
                </option>
              ))}
            </select>
            <select
              aria-label="Fitted or removed"
              value={installAction}
              onChange={(event) => setInstallAction(event.target.value)}
            >
              <option value="fitted">fitted</option>
              <option value="removed">removed</option>
            </select>
            <input
              aria-label="Date"
              type="date"
              value={installDate}
              onChange={(event) => setInstallDate(event.target.value)}
            />
            <button
              type="button"
              className="opt"
              data-testid="install-record"
              disabled={!installPart || busy}
              onClick={() => void record()}
            >
              Record it
            </button>
          </div>
          {installLine ? (
            <p className="setup-line" data-testid="install-saved">
              {installLine}
            </p>
          ) : null}
        </div>
        {!hasDrives ? (
          <div className="setup-ask" data-testid="ask-box">
            <div className="setup-row">
              <input
                aria-label="Ask anything"
                type="text"
                placeholder="Ask anything"
                value={askText}
                onChange={(event) => setAskText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void ask();
                }}
              />
              <button type="button" className="opt" data-testid="ask-send" disabled={!askText.trim() || busy} onClick={() => void ask()}>
                Ask
              </button>
            </div>
            {asked ? (
              <p className="setup-line" data-testid="ask-answer">
                {asked}
              </p>
            ) : null}
          </div>
        ) : null}
        {error ? <div className="err">{error}</div> : null}
      </section>
    );
  }

  // -- first open: describe the car, correct the card, confirm ---------------
  return (
    <section className="card setup" data-testid="car-setup">
      <div className="eyebrow">Your car</div>
      <p className="setup-line">
        {profile ? "Correct any field and confirm." : "First, your car in your own words — about a minute. I fill the card, you correct it."}
      </p>
      {hasLlm && !fields ? (
        <>
          <p className="muted" data-testid="setup-example">
            For example: {EXAMPLE}
          </p>
          <textarea
            data-testid="setup-text"
            rows={3}
            placeholder="Describe your car…"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="setup-row">
            <button type="button" className="opt" data-testid="setup-fill" disabled={!text.trim() || busy} onClick={() => void fill()}>
              {busy ? "Filling…" : "Fill my card"}
            </button>
          </div>
        </>
      ) : null}
      {!hasLlm && !fields ? (
        <>
          <p className="muted">No key set: fill the form — the same fields the card would hold.</p>
          <div className="setup-row">
            <button type="button" className="opt" data-testid="setup-form-start" onClick={() => void startForm()}>
              Fill the form
            </button>
          </div>
        </>
      ) : null}
      {fields ? (
        <div data-testid="setup-form">
          {SCALARS.map((name) => (
            <label className="frow" key={name}>
              <span>{LABELS[name]}</span>
              <input
                type="text"
                data-testid={`setup-field-${name}`}
                value={fields[name]}
                onChange={(event) => setFields((prev) => (prev ? { ...prev, [name]: event.target.value } : prev))}
              />
            </label>
          ))}
          <div className="frow">
            <span>Parts fitted</span>
            <div className="opts">
              {(spec?.parts ?? []).map((part) => (
                <label className={`opt${fields.parts.includes(part) ? " on" : ""}`} key={part}>
                  <input
                    type="checkbox"
                    data-testid={`setup-part-${part}`}
                    checked={fields.parts.includes(part)}
                    onChange={() => togglePart(part)}
                  />{" "}
                  {partName(part)}
                </label>
              ))}
            </div>
          </div>
          {spec ? <p className="muted">{spec.basemapNote}</p> : null}
          {draft && draft.missing.length ? (
            <p className="muted" data-testid="setup-missing">
              Still to say: {draft.missing.join(", ")}.
            </p>
          ) : null}
          <div className="setup-row">
            <button type="button" className="opt" data-testid="setup-confirm" disabled={busy} onClick={() => void confirm()}>
              {busy ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      ) : null}
      {savedLine && !fields ? (
        <p className="setup-line" data-testid="setup-saved">
          {savedLine}
          {savedInstalls.length
            ? ` (${savedInstalls.map((row) => `${partName(row.part)} ${row.action}`).join(", ")})`
            : ""}
        </p>
      ) : null}
      {error ? <div className="err">{error}</div> : null}
    </section>
  );
}
