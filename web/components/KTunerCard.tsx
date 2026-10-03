"use client";

/**
 * The KTuner card: what to type into KTuner, in the order the owner does it.
 *
 *   one sentence (what, and why) -> which file to start from -> the cells, ticked
 *   as typed -> save as -> if it goes wrong -> what the next Drive proves.
 *
 * Every word and number comes from the checked change (server/kta_server/flash.py):
 * table names as KTuner spells them, rows by rpm, columns as "N of 16", before ->
 * after in each table's own decimals. "I flashed it" is the only thing that makes
 * a Map version; "Not now" makes nothing.
 */
import { useEffect, useMemo, useState } from "react";

import "../app/flash.css";
import { SERVER_URL } from "../lib/types";
import type { KTunerCard as Card, KTunerCell, KTunerGroup, UndoCard } from "../lib/types";

export const MAP_CHANGED = "kta-map-changed";

type Outcome = { line: string; next?: string } | null;

async function send(path: string, body: Record<string, unknown>): Promise<Outcome & { created?: boolean }> {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail ?? `That did not go through (${response.status}).`);
  return payload;
}

/** Ticks survive a reload: typing 40 cells on a phone is not redone because the tab slept. */
function useTicks(key: string): [Set<string>, (ids: string[], on: boolean) => void] {
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      setTicks(new Set(JSON.parse(localStorage.getItem(`kta-ticks-${key}`) ?? "[]")));
    } catch {
      /* no storage: ticks live for this page only */
    }
  }, [key]);
  const set = (ids: string[], on: boolean) =>
    setTicks((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      try {
        localStorage.setItem(`kta-ticks-${key}`, JSON.stringify([...next]));
      } catch {
        /* see above */
      }
      return next;
    });
  return [ticks, set];
}

function rowsOf(cells: KTunerCell[]): [string, KTunerCell[]][] {
  const rows = new Map<string, KTunerCell[]>();
  cells.forEach((cell) => rows.set(cell.row, [...(rows.get(cell.row) ?? []), cell]));
  return [...rows.entries()];
}

function Group({
  group,
  ticks,
  tick,
  index,
}: {
  group: KTunerGroup;
  ticks: Set<string>;
  tick: (ids: string[], on: boolean) => void;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const id = (cell: KTunerCell) => `${index}:${cell.id}`;
  return (
    <section className="kc-group" data-testid="ktuner-group">
      <h4 className="kc-tables">
        {group.same ? "The same cells in all " + group.tables.length + " tables" : "Table"}
      </h4>
      <ul className="kc-names" aria-label="Tables to change">
        {group.tables.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <p className="kc-what">{group.what}</p>
      <p className="kc-effect">
        <b>For your car:</b> {group.effect}
      </p>
      {group.pasteRow ? (
        <div className="kc-paste">
          <button
            type="button"
            className="kc-btn quiet"
            onClick={() => {
              void navigator.clipboard?.writeText(group.pasteRow ?? "");
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy the whole row (tab-separated)"}
          </button>
        </div>
      ) : null}
      <p className="kc-note">
        Each line is an rpm row, then a column counted from the left as KTuner draws it. Tick a cell once you have typed it
        {group.same ? " in every one of the tables above" : ""}.
      </p>
      {rowsOf(group.cells).map(([row, cells]) => {
        const all = cells.every((cell) => ticks.has(id(cell)));
        return (
          <div className="kc-row" key={row} data-row={row}>
            <label className="kc-rowhead">
              <input type="checkbox" checked={all} onChange={() => tick(cells.map(id), !all)} />
              <b>{row}</b>
              <span className="muted">{all ? "row done" : "tick the row"}</span>
            </label>
            <ul className="kc-cells">
              {cells.map((cell) => (
                <li key={cell.id}>
                  <label className={ticks.has(id(cell)) ? "kc-cell on" : "kc-cell"}>
                    <input
                      type="checkbox"
                      checked={ticks.has(id(cell))}
                      onChange={() => tick([id(cell)], !ticks.has(id(cell)))}
                      data-testid="ktuner-cell"
                    />
                    <span className="kc-col">{cell.column}</span>
                    <span className="kc-val">
                      {cell.before} → <b>{cell.after}</b> {cell.unit}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

export function KTunerCard({ card }: { card: Card }) {
  const [ticks, tick] = useTicks(card.changeId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const all = useMemo(
    () => card.groups.flatMap((group, index) => group.cells.map((cell) => `${index}:${cell.id}`)),
    [card],
  );
  const done = all.filter((id) => ticks.has(id)).length;

  async function act(path: string) {
    setBusy(true);
    setError(null);
    try {
      setOutcome(await send(path, { changeId: card.changeId }));
      window.dispatchEvent(new Event(MAP_CHANGED));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (outcome) {
    return (
      <div className="kc done" data-testid="ktuner-done">
        <b>{outcome.line}</b>
        {outcome.next ? <p>{outcome.next}</p> : null}
      </div>
    );
  }

  return (
    <div className="kc" data-testid="ktuner-card" data-change={card.changeId}>
      <div className="eyebrow">Type this into KTuner</div>
      <p className="kc-lead">{card.headline}</p>
      <ol className="kc-steps">
        <li>
          In KTuner, open <b>{card.writtenOn.replace("Written on ", "")}</b>.
        </li>
        <li>
          Change {card.cellCount} cell{card.cellCount === 1 ? "" : "s"}
          {card.tableCount > 1 ? ` in each of ${card.tableCount} tables` : ""}. Tick each as you type it.
        </li>
        <li>
          Save as <span className="mono">{card.saveAs}</span>, then flash it.
        </li>
      </ol>

      {card.groups.map((group, index) => (
        <Group key={group.tables.join()} group={group} ticks={ticks} tick={tick} index={index} />
      ))}

      <div className="kc-facts">
        <p>
          <b>If it goes wrong:</b> {card.undo.line ?? "flash the file you started from."}
        </p>
        {card.proof ? (
          <p>
            <b>Your next Drive proves it:</b> {card.proof}
          </p>
        ) : null}
        <p className="muted">{card.afterFlash}</p>
        <p className="muted">{card.checked}</p>
      </div>

      <div className="kc-actions">
        <span className="kc-progress" aria-live="polite">
          {done} of {all.length} ticked
        </span>
        <button
          type="button"
          className="kc-btn"
          data-testid="flashed-it"
          disabled={busy || done < all.length}
          onClick={() => void act("/api/flash/confirm")}
        >
          I flashed it
        </button>
        <button type="button" className="kc-btn quiet" data-testid="not-now" disabled={busy} onClick={() => void act("/api/flash/not-now")}>
          Not now
        </button>
      </div>
      {error ? <div className="err">{error}</div> : null}
    </div>
  );
}

/** Undo: nothing to type, a file to load and flash back. */
export function UndoFlash({ card }: { card: UndoCard }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  async function flashed() {
    setBusy(true);
    setError(null);
    try {
      setOutcome(await send("/api/flash/restore", { version: card.restore.version, kind: "undo" }));
      window.dispatchEvent(new Event(MAP_CHANGED));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (outcome) {
    return (
      <div className="kc done" data-testid="undo-done">
        <b>{outcome.line}</b>
        {outcome.next ? <p>{outcome.next}</p> : null}
      </div>
    );
  }
  return (
    <div className="kc" data-testid="undo-card">
      <div className="eyebrow">Put the earlier map back</div>
      <p className="kc-lead">{card.restore.line}</p>
      {card.proof ? (
        <p>
          <b>Your next Drive proves it:</b> {card.proof}
        </p>
      ) : null}
      <p className="muted">{card.afterFlash}</p>
      <div className="kc-actions">
        <button type="button" className="kc-btn" data-testid="flashed-it" disabled={busy} onClick={() => void flashed()}>
          I flashed it
        </button>
      </div>
      {error ? <div className="err">{error}</div> : null}
    </div>
  );
}
