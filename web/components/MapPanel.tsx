"use client";

/**
 * Which Map version is on the car, how to get back to the KTuner basemap, and the
 * History file. The owner must never wonder which map the car is on, and the
 * History file is the only copy of their Flashes outside this machine.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import "../app/flash.css";
import { SERVER_URL } from "../lib/types";
import { MAP_CHANGED } from "./KTunerCard";

type Version = { n: number; label: string; name: string };
type Status = { active: Version | null; versions: Version[]; revert: { version: number; name: string; line: string } | null };

export function MapPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/flash`, { cache: "no-store" });
      if (response.ok) setStatus((await response.json()) as Status);
    } catch {
      /* the server is down: the panel stays quiet */
    }
  }, []);
  useEffect(() => {
    void load();
    window.addEventListener(MAP_CHANGED, load);
    return () => window.removeEventListener(MAP_CHANGED, load);
  }, [load]);

  async function post(path: string, body: unknown): Promise<{ ok: boolean; payload: Record<string, any> }> {
    const response = await fetch(`${SERVER_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: response.ok, payload: await response.json().catch(() => ({})) };
  }

  async function revert() {
    setBusy(true);
    const { ok, payload } = await post("/api/flash/restore", { version: 1, kind: "revert" });
    setNote(ok ? `${payload.line} ${payload.next}` : (payload.detail ?? "That did not go through."));
    setBusy(false);
    void load();
  }

  async function importFile(file: File) {
    setBusy(true);
    try {
      const { ok, payload } = await post("/api/history", JSON.parse(await file.text()));
      const added = payload.added ?? {};
      setNote(
        ok
          ? `Merged: ${added.drives ?? 0} Drives, ${added.flashes ?? 0} Flashes, ${added.installs ?? 0} Installs, ${added.answers ?? 0} answers added. Nothing was overwritten.`
          : "That is not a History file I can read.",
      );
    } catch {
      setNote("That is not a History file I can read.");
    }
    setBusy(false);
    void load();
  }

  if (!status?.active) return null;
  return (
    <div className="card mappanel" data-testid="map-panel">
      <div className="eyebrow">Your map</div>
      <p className="mp-active" data-testid="active-map">
        On <b>{status.active.label}</b> · {status.active.name}
      </p>
      {status.revert ? (
        <div className="mp-revert">
          <p className="muted">{status.revert.line}</p>
          <button type="button" className="kc-btn quiet" data-testid="revert" disabled={busy} onClick={() => void revert()}>
            I flashed the KTuner basemap
          </button>
        </div>
      ) : null}
      <div className="mp-file">
        <span className="muted">History file: your Drives, Map versions, Flashes, Installs and answers. Raw logs stay on the server.</span>
        <div className="kc-actions">
          <a className="kc-btn quiet" href={`${SERVER_URL}/api/history`} download="ktuner-history.json" data-testid="export-history">
            Export
          </a>
          <button type="button" className="kc-btn quiet" disabled={busy} onClick={() => picker.current?.click()}>
            Import
          </button>
          <input
            ref={picker}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            data-testid="import-history"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>
      {note ? <p className="mp-note" role="status">{note}</p> : null}
    </div>
  );
}
