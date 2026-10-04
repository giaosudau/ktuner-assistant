"use client";

/**
 * Review a whole KTuner table before typing anything into KTuner: the 2D grid as KTuner draws it
 * (rpm rows × load columns, every value printed, planned cells outlined before → after) and a 3D
 * surface to see the shape. Read-only: a change only ever comes from the checked Flash plan.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import * as api from "../lib/api";
import { Icon } from "./Icons";

type Change = { row: number; col: number; before: string; after: string; unit?: string };

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/** Sequential scale on the accent: low = faint, high = full. Values are printed, so colour is never the only cue. */
function shade(v: number, lo: number, hi: number): string {
  const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
  return `color-mix(in srgb, var(--accent) ${Math.round(8 + t * 62)}%, var(--bg-raised))`;
}

function Grid({ t, after }: { t: api.MapTable; after: boolean }) {
  const changed = new Map(t.changes.map((c) => [`${c.row}:${c.col}`, c]));
  const flat = t.values.flat().filter((v): v is number => typeof v === "number");
  const lo = Math.min(...flat);
  const hi = Math.max(...flat);
  return (
    <div className="tv-grid-wrap">
      <table className="tv-grid" aria-label={`${t.table} values`}>
        <thead>
          <tr>
            <th scope="col">rpm \ load</th>
            {Array.from({ length: t.cols }, (_, c) => (
              <th key={c} scope="col">
                {c + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.values.map((row, r) => (
            <tr key={r}>
              <th scope="row">{t.rpm_axis[r]?.toLocaleString("en-US") ?? r + 1}</th>
              {row.map((v, c) => {
                const ch = changed.get(`${r}:${c}`);
                const shown = ch && after ? num(ch.after) ?? v : v;
                return (
                  <td
                    key={c}
                    className={ch ? "chg" : ""}
                    style={{ background: typeof shown === "number" ? shade(shown, lo, hi) : undefined }}
                    title={ch ? `${ch.before} → ${ch.after} ${ch.unit ?? ""}` : String(v)}
                  >
                    {ch ? (
                      <>
                        <s>{ch.before}</s> {ch.after}
                      </>
                    ) : (
                      v
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A 3D surface: quads painted back to front, rotated about the vertical axis. */
function Surface({ t, after, turn }: { t: api.MapTable; after: boolean; turn: number }) {
  const W = 640;
  const H = 380;
  const changed = new Map(t.changes.map((c) => [`${c.row}:${c.col}`, c]));
  const z = t.values.map((row, r) =>
    row.map((v, c) => {
      const ch = changed.get(`${r}:${c}`);
      return (ch && after ? num(ch.after) : null) ?? (typeof v === "number" ? v : 0);
    }),
  );
  const flat = z.flat();
  const lo = Math.min(...flat);
  const hi = Math.max(...flat);
  const rows = z.length;
  const cols = z[0]?.length ?? 0;
  const a = (turn * Math.PI) / 180;
  const elev = 0.55;
  const project = (r: number, c: number, v: number) => {
    // Centre the grid, unit square footprint, rotate about the vertical axis.
    const x = c / Math.max(1, cols - 1) - 0.5;
    const y = r / Math.max(1, rows - 1) - 0.5;
    const rx = x * Math.cos(a) - y * Math.sin(a);
    const ry = x * Math.sin(a) + y * Math.cos(a);
    const h = hi === lo ? 0 : (v - lo) / (hi - lo);
    return { sx: W / 2 + rx * 420, sy: H * 0.62 + ry * 420 * elev - h * 170, depth: ry };
  };
  const quads: { d: string; depth: number; fill: string; chg: boolean }[] = [];
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const p = [project(r, c, z[r][c]), project(r, c + 1, z[r][c + 1]), project(r + 1, c + 1, z[r + 1][c + 1]), project(r + 1, c, z[r + 1][c])];
      const mean = (z[r][c] + z[r][c + 1] + z[r + 1][c + 1] + z[r + 1][c]) / 4;
      quads.push({
        d: `M${p.map((q) => `${q.sx.toFixed(1)},${q.sy.toFixed(1)}`).join("L")}Z`,
        depth: p.reduce((s, q) => s + q.depth, 0) / 4,
        fill: shade(mean, lo, hi),
        chg: changed.has(`${r}:${c}`),
      });
    }
  }
  quads.sort((p, q) => p.depth - q.depth);
  // Fit the view to the surface at any turn, with room for the axis labels.
  const pts = [0, rows - 1].flatMap((r) => [0, cols - 1].flatMap((c) => [project(r, c, lo), project(r, c, hi)]));
  const xs = pts.map((q) => q.sx);
  const ys = pts.map((q) => q.sy);
  const pad = 40;
  const box = `${Math.min(...xs) - pad} ${Math.min(...ys) - pad} ${Math.max(...xs) - Math.min(...xs) + pad * 2} ${Math.max(...ys) - Math.min(...ys) + pad * 2}`;
  const corner = (r: number, c: number, text: string) => {
    const q = project(r, c, lo);
    return (
      <text key={text} x={q.sx} y={q.sy + 18} className="tv-axis" textAnchor="middle">
        {text}
      </text>
    );
  };
  return (
    <svg className="tv-surface" viewBox={box} role="img" aria-label={`${t.table} as a 3D surface, ${lo} to ${hi}`}>
      {quads.map((q, i) => (
        <path key={i} d={q.d} fill={q.fill} className={q.chg ? "q chg" : "q"} />
      ))}
      {corner(0, 0, `${t.rpm_axis[0] ?? ""} rpm · col 1`)}
      {corner(rows - 1, 0, `${t.rpm_axis[rows - 1]?.toLocaleString("en-US") ?? ""} rpm`)}
      {corner(0, cols - 1, `col ${cols}`)}
    </svg>
  );
}

/** A one-row table (MAF Scaling: 103 points) reads as a curve, not a surface. */
function Curve({ t }: { t: api.MapTable }) {
  const v = (t.values[0] ?? []).filter((x): x is number => typeof x === "number");
  const W = 640;
  const H = 220;
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const pts = v.map((y, i) => `${((i / Math.max(1, v.length - 1)) * (W - 20) + 10).toFixed(1)},${(H - 14 - ((y - lo) / (hi - lo || 1)) * (H - 28)).toFixed(1)}`);
  return (
    <svg className="tv-surface" viewBox={`0 0 ${W} ${H + 20}`} role="img" aria-label={`${t.table}: ${v.length} points from ${lo} to ${hi}`}>
      <polyline points={pts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
      <text x={12} y={H + 14} className="tv-axis">point 1</text>
      <text x={W - 12} y={H + 14} className="tv-axis" textAnchor="end">point {v.length}</text>
      <text x={12} y={12} className="tv-axis">{hi}</text>
      <text x={12} y={H - 18} className="tv-axis">{lo}</text>
    </svg>
  );
}

export function TableViewer({ table, onClose }: { table: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState<string | null>(table);
  const [families, setFamilies] = useState<api.MapFamily[]>([]);
  const [data, setData] = useState<api.MapTable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [after, setAfter] = useState(true);
  const [turn, setTurn] = useState(35);

  useEffect(() => {
    setName(table);
    if (table) ref.current?.showModal();
    else ref.current?.close();
  }, [table]);
  useEffect(() => {
    void api.mapFamilies().then(setFamilies).catch(() => setFamilies([]));
  }, []);
  useEffect(() => {
    if (!name) return;
    setError(null);
    api.mapTable(name).then(setData).catch((e: Error) => setError(e.message));
  }, [name]);

  const siblings = useMemo(() => families.find((f) => f.tables.includes(name ?? ""))?.tables ?? [], [families, name]);
  const oneRow = (data?.rows ?? 0) <= 1;

  return (
    <dialog ref={ref} className="tv" onClose={onClose} aria-label="Table viewer">
      <div className="tv-head">
        <div>
          <div className="tv-title">{data?.table ?? name}</div>
          <div className="muted tv-sub">
            Map version {data?.version ?? "–"} · {data ? `${data.rows} × ${data.cols}` : ""}
            {data ? ` · ${data.min} to ${data.max}` : ""} · {data?.editable_here ? "changed only through the checked plan" : "read-only here"}
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
          <Icon name="x" />
        </button>
      </div>
      <div className="tv-bar">
        <label className="field tv-pick">
          <span className="sr-only">Table</span>
          <select value={name ?? ""} onChange={(e) => setName(e.target.value)} data-testid="tv-table">
            {families.map((f) => (
              <optgroup key={f.id} label={f.title}>
                {f.tables.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {!oneRow ? (
          <div className="seg" role="group" aria-label="View">
            <button type="button" className={view === "2d" ? "on" : ""} onClick={() => setView("2d")} data-testid="tv-2d">
              2D
            </button>
            <button type="button" className={view === "3d" ? "on" : ""} onClick={() => setView("3d")} data-testid="tv-3d">
              3D
            </button>
          </div>
        ) : null}
        {data?.changes.length ? (
          <label className="tv-toggle">
            <input type="checkbox" checked={after} onChange={(e) => setAfter(e.target.checked)} /> Show the planned change ({data.changes.length} cells)
          </label>
        ) : null}
        {siblings.length > 1 ? <span className="muted tv-sib">{siblings.length} tables in this family</span> : null}
      </div>
      {error ? <div className="err">{error}</div> : null}
      {data ? (
        <div className="tv-body" data-testid="table-viewer">
          {oneRow ? <Curve t={data} /> : view === "2d" ? <Grid t={data} after={after} /> : (
            <>
              <Surface t={data} after={after} turn={turn} />
              <label className="tv-turn">
                Turn
                <input type="range" min={0} max={360} value={turn} onChange={(e) => setTurn(Number(e.target.value))} />
              </label>
            </>
          )}
          <p className="muted tv-note">
            {oneRow
              ? `${data.cols} points along the sensor's frequency range, low to high, as KTuner lists them.`
              : "Rows are rpm; columns are counted from the left as KTuner draws them (the load axis isn't in the map data)."}
            {data.changes.length ? " Outlined cells are the checked plan: struck value now, new value after." : ""}
          </p>
        </div>
      ) : (
        <div className="work-live" style={{ padding: 20 }}>
          <span className="spinner" />
          Reading the table…
        </div>
      )}
    </dialog>
  );
}
