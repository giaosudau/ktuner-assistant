"use client";

/**
 * The plan to type into KTuner, in the order the owner does it: open the file,
 * change the cells (ticked as typed), save as, flash, then tell me.
 *
 * Every word and number comes from the checked change (server/kta_server/flash.py):
 * table names as KTuner spells them, rows by rpm, columns as "N of 16", before ->
 * after in each table's own decimals. "I flashed it" is the only thing that makes
 * a Map version, and it is the owner's own message in the thread.
 */
import { useEffect, useMemo, useState } from "react";

import type { KTunerCard as Card, KTunerCell, KTunerGroup, UndoCard } from "../lib/types";
import { Icon } from "./Icons";

export type FlashAct = (action: "confirm" | "not-now" | "undo" | "revert", ref: { changeId?: string; version?: number }) => void;

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

function Group({ group, ticks, tick, index }: { group: KTunerGroup; ticks: Set<string>; tick: (ids: string[], on: boolean) => void; index: number }) {
  const [copied, setCopied] = useState(false);
  const id = (cell: KTunerCell) => `${index}:${cell.id}`;
  return (
    <div className="kt-group" data-testid="ktuner-group">
      <div className="kt-group-h">
        <b>{group.same ? `The same cells in all ${group.tables.length} tables` : "Table"}</b>
        <ul className="kt-tables" aria-label="Tables to change">
          {group.tables.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p style={{ margin: "8px 0 0" }}>{group.what}</p>
        <p style={{ margin: "4px 0 0" }} className="muted">
          For your car: {group.effect}
        </p>
        {group.pasteRow ? (
          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: 8, minHeight: 34 }}
            onClick={() => {
              void navigator.clipboard?.writeText(group.pasteRow ?? "");
              setCopied(true);
            }}
          >
            <Icon name={copied ? "check" : "copy"} />
            {copied ? "Copied" : "Copy the whole row"}
          </button>
        ) : null}
      </div>
      {rowsOf(group.cells).map(([row, cells]) => {
        const all = cells.every((cell) => ticks.has(id(cell)));
        return (
          <div className="kt-row" key={row} data-row={row}>
            <label className="kt-rowhead">
              <input type="checkbox" checked={all} onChange={() => tick(cells.map(id), !all)} />
              <b>{row}</b>
              <span className="muted">{all ? "row typed" : "tick the whole row"}</span>
            </label>
            <ul className="kt-cells">
              {cells.map((cell) => (
                <li key={cell.id}>
                  <label className={ticks.has(id(cell)) ? "kt-cell on" : "kt-cell"}>
                    <input
                      type="checkbox"
                      checked={ticks.has(id(cell))}
                      onChange={() => tick([id(cell)], !ticks.has(id(cell)))}
                      data-testid="ktuner-cell"
                    />
                    <span>
                      <span className="col">{cell.column}</span>
                      <br />
                      <span className="val">
                        {cell.before} → <b>{cell.after}</b> {cell.unit}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function KTunerCard({ card, acted, busy, onFlash }: { card: Card; acted?: string; busy: boolean; onFlash: FlashAct }) {
  const [ticks, tick] = useTicks(card.changeId);
  const all = useMemo(() => card.groups.flatMap((g, i) => g.cells.map((c) => `${i}:${c.id}`)), [card]);
  const done = all.filter((id) => ticks.has(id)).length;

  return (
    <div data-testid="ktuner-card" data-change={card.changeId}>
      <p>{card.headline}</p>
      <ol className="numbered kt-steps">
        <li>
          In KTuner, open <b>{card.writtenOn.replace("Written on ", "")}</b>.
        </li>
        <li>
          Change {card.cellCount} cell{card.cellCount === 1 ? "" : "s"}
          {card.tableCount > 1 ? ` in each of ${card.tableCount} tables` : ""}, ticking each one below as you type it.
        </li>
        <li>
          Save as <span className="mono">{card.saveAs}</span> and flash it.
        </li>
        <li>Tell me here you flashed it, then log the drive that proves it.</li>
      </ol>

      {card.groups.map((group, index) => (
        <Group key={group.tables.join()} group={group} ticks={ticks} tick={tick} index={index} />
      ))}

      <div className="facts">
        <span>
          <b>If it goes wrong:</b> {card.undo.line ?? "flash the file you started from."}
        </span>
        {card.proof ? (
          <span>
            <b>Your next drive proves it:</b> {card.proof}
          </span>
        ) : null}
        <span className="muted">{card.afterFlash}</span>
        <span className="muted" data-testid="readback-possible">
          {card.readback.line}
        </span>
        <span className="muted">{card.checked}</span>
      </div>

      {acted ? (
        <div className="note-line" data-testid="ktuner-done">
          <Icon name="check" />
          <span>You said: {acted}</span>
        </div>
      ) : (
        <div className="btn-row">
          <span className="meta" aria-live="polite">
            {done} of {all.length} cells typed
          </span>
          <button
            type="button"
            className="btn ghost"
            data-testid="not-now"
            disabled={busy}
            onClick={() => onFlash("not-now", { changeId: card.changeId })}
          >
            Not now
          </button>
          <button
            type="button"
            className="btn primary"
            data-testid="flashed-it"
            disabled={busy || done < all.length}
            title={done < all.length ? "Tick every cell first" : undefined}
            onClick={() => onFlash("confirm", { changeId: card.changeId })}
          >
            I flashed it
          </button>
        </div>
      )}
    </div>
  );
}

/** Undo: nothing to type, a file to load and flash back. */
export function UndoFlash({ card, acted, busy, onFlash }: { card: UndoCard; acted?: string; busy: boolean; onFlash: FlashAct }) {
  return (
    <div data-testid="undo-card">
      <ol className="numbered">
        <li>{card.restore.line}</li>
        <li>Tell me here you flashed it back.</li>
      </ol>
      <div className="facts">
        {card.proof ? (
          <span>
            <b>Your next drive proves it:</b> {card.proof}
          </span>
        ) : null}
        <span className="muted">{card.afterFlash}</span>
      </div>
      {acted ? (
        <div className="note-line" data-testid="undo-done">
          <Icon name="check" />
          <span>You said: {acted}</span>
        </div>
      ) : (
        <div className="btn-row">
          <span className="meta">Map version {card.restore.version} · {card.restore.name}</span>
          <button
            type="button"
            className="btn primary"
            data-testid="flashed-it"
            disabled={busy}
            onClick={() => onFlash("undo", { version: card.restore.version })}
          >
            I flashed it back
          </button>
        </div>
      )}
    </div>
  );
}
