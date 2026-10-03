"use client";

/**
 * Pictures in the reply (ticket 15): the engine makes the data, this only draws
 * it. Inline SVG, no chart library; every number printed here is also in the
 * reply text, and each picture has a caption that says what it shows.
 */
import type { Picture } from "../lib/types";
import { Icon } from "./Icons";

// A narrow coordinate box keeps 11-unit tick labels readable when a phone shrinks the plot.
const W = 420;
const H = 170;
const PAD = { l: 40, r: 8, t: 10, b: 24 };

function scale(d0: number, d1: number, r0: number, r1: number) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}
/** Round tick values (1, 2, 5 × 10^k) inside [lo, hi], about n of them. */
function ticks(lo: number, hi: number, n = 4): number[] {
  const raw = (hi - lo) / n || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}
const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

function Lines({ series, unit, markAt }: { series: { name: string; points: [number, number][] }[]; unit: string; markAt?: number }) {
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  let [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const padY = (y1 - y0) * 0.1 || 1;
  y0 -= padY;
  y1 += padY;
  const x = scale(x0, x1, PAD.l, W - PAD.r);
  const y = scale(y0, y1, H - PAD.b, PAD.t);
  const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  return (
    <svg className="plot" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.name).join(" and ")}>
      {ticks(y0, y1).map((v) => (
        <g key={v}>
          <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
          <text className="tick" x={PAD.l - 6} y={y(v) + 4} textAnchor="end">
            {fmt(v)}
          </text>
        </g>
      ))}
      {ticks(x0, x1, 4).map((v) => (
        <text key={v} className="tick" x={x(v)} y={H - 8} textAnchor="middle">
          {Math.round(v)}
          {unit === "rpm" ? "" : " s"}
        </text>
      ))}
      {markAt !== undefined && markAt >= x0 && markAt <= x1 ? <line className="mark" x1={x(markAt)} x2={x(markAt)} y1={PAD.t} y2={H - PAD.b} /> : null}
      {series.map((s, i) => (
        <path key={s.name} className={i === 0 ? "s1" : "s2"} d={path(s.points)} />
      ))}
    </svg>
  );
}

/** Bars in HTML, not SVG: the labels keep their size on a phone. */
function Bars({ bars, unit }: { bars: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(...bars.map((b) => Math.abs(b.value))) || 1;
  return (
    <div className="hbars" role="img" aria-label={bars.map((b) => `${b.label} ${b.value}${unit}`).join(", ")}>
      {bars.map((b, i) => (
        <div className="hbar" key={b.label}>
          <span className="lbl">{b.label}</span>
          <span className="track">
            <span className={`fill${i === bars.length - 1 ? " hi" : ""}`} style={{ width: `${Math.max(2, (Math.abs(b.value) / max) * 100)}%` }} />
          </span>
          <span className="val">
            {b.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function MapGrid({ p }: { p: Extract<Picture, { kind: "map_grid" }> }) {
  const changed = new Map(p.changes.map((c) => [`${c.row}:${c.col}`, c]));
  const rows = p.rpm.map((rpm, r) => ({ rpm, r })).filter(({ r }) => p.changes.some((c) => Math.abs(c.row - r) <= 2) || p.driven.includes(r));
  return (
    <div className="grid-wrap">
      <table className="mapgrid" aria-label={`${p.title}: changed cells`}>
        <thead>
          <tr>
            <th scope="col">rpm</th>
            {Array.from({ length: p.cols }, (_, c) => (
              <th key={c} scope="col">
                {c + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ rpm, r }) => (
            <tr key={rpm} className={p.driven.includes(r) ? "driven" : ""}>
              <th scope="row">{rpm.toLocaleString("en-US")}</th>
              {Array.from({ length: p.cols }, (_, c) => {
                const hit = changed.get(`${r}:${c}`);
                return (
                  <td key={c} className={hit ? "chg" : ""} title={hit ? `${hit.before} → ${hit.after} ${p.unit}` : undefined}>
                    {hit ? hit.after : ""}
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

export function Chart({ picture }: { picture: Picture }) {
  if (picture.kind === "cant-tell") {
    return (
      <section className="card chart" data-testid="picture" data-kind="cant-tell">
        <h3 className="card-h">
          <Icon name="chart" />
          {picture.title}
        </h3>
        <p className="small">{picture.why}</p>
      </section>
    );
  }
  return (
    <section className="card chart" data-testid="picture" data-kind={picture.kind}>
      <h3 className="card-h">
        <Icon name="chart" />
        {picture.title}
      </h3>
      {picture.kind === "trace" ? (
        <>
          <Lines series={picture.series} unit={picture.unit} markAt={picture.moment.at} />
          <div className="legend">
            {picture.series.map((s, i) => (
              <span key={s.name}>
                <i className={i ? "dash" : ""} />
                {s.name}
                {picture.unit ? ` (${picture.unit})` : ""}
              </span>
            ))}
            <span>Seconds around {picture.moment.label.toLowerCase()} (dotted line)</span>
          </div>
        </>
      ) : null}
      {picture.kind === "baseline" || picture.kind === "proof" ? (
        <>
          <Bars bars={picture.bars} unit={picture.unit} />
          {picture.kind === "baseline" && picture.note ? <p className="small">{picture.note}</p> : null}
        </>
      ) : null}
      {picture.kind === "maf_gap" ? (
        <>
          <Lines
            series={[
              { name: "Now", points: picture.x.map((x, i) => [x, picture.before[i]] as [number, number]) },
              { name: "Planned", points: picture.x.map((x, i) => [x, picture.after[i]] as [number, number]) },
            ]}
            unit="rpm"
          />
          <div className="legend">
            <span>
              <i />
              Now
            </span>
            <span>
              <i className="dash" />
              Planned (largest gap {picture.gapPct} %)
            </span>
          </div>
        </>
      ) : null}
      {picture.kind === "map_grid" ? (
        <>
          <MapGrid p={picture} />
          <div className="legend">
            <span>
              <i className="sq" />
              Changed cell, new value ({picture.unit})
            </span>
            <span>
              <i className="sq soft" />
              rpm rows your drives sat in under boost
            </span>
          </div>
        </>
      ) : null}
    </section>
  );
}
