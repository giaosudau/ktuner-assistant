"use client";

/**
 * The tuning shop's cards (tuning-shop D4-D6): did your log meet the brief, the health report,
 * the whole map at a high level, and the drive brief itself. Every row is the server's; the
 * cards only lay it out. A family in the map tour can be opened as a question to the tuner.
 */
import type { FuelTest } from "../lib/api";
import type { BandMark, CalibrationCard, Checkpoint, DriveBrief, FlashPlan, HealthBand, HealthReport, HousingOption, MapTour } from "../lib/types";
import { GaugeTableView } from "./Cards";
import { Icon } from "./Icons";
import { Pill } from "./Pill";

// ------------------------------------------------------- log checkpoints
function CheckRow({ r }: { r: Checkpoint }) {
  return (
    <li data-met={String(r.met)}>
      <span className={`tick ${r.met === true ? "yes" : r.met === false ? "no" : "na"}`} aria-hidden="true">
        <Icon name={r.met === true ? "check" : r.met === false ? "x" : "info"} />
      </span>
      <span className="label">{r.label}</span>
      <span className="val">{r.value}</span>
      <span className="sr-only">{r.met === true ? "met" : r.met === false ? "not met" : "can't tell"}</span>
    </li>
  );
}

/** Met of total as a small ring; it fills once when the card first appears. */
function ProgressRing({ met, total }: { met: number; total: number }) {
  const pct = total ? (met / total) * 100 : 0;
  return (
    <svg className="ring" viewBox="0 0 24 24" aria-hidden="true" data-testid="checkpoints-ring" data-met={met} data-total={total}>
      <circle className="ring-track" cx="12" cy="12" r="9.5" />
      {met ? (
        <circle
          className="ring-fill"
          cx="12"
          cy="12"
          r="9.5"
          pathLength={100}
          style={{ strokeDasharray: `${pct} 100` }}
          transform="rotate(-90 12 12)"
        />
      ) : null}
    </svg>
  );
}

export function CheckpointsCard({ rows }: { rows: Checkpoint[] }) {
  if (!rows.length) return null;
  const metRows = rows.filter((r) => r.met === true);
  // What needs the owner first: missed, then can't tell; the met rows fold away.
  const open = [...rows.filter((r) => r.met === false), ...rows.filter((r) => r.met !== true && r.met !== false)];
  return (
    <section className="card" data-testid="checkpoints">
      <h3 className="card-h">
        <Icon name="route" />
        <span className="grow">Did this log meet the brief?</span>
        <ProgressRing met={metRows.length} total={rows.length} />
        <span className="muted small-count" data-testid="checkpoints-count">
          {metRows.length} of {rows.length} met
        </span>
      </h3>
      {open.length ? (
        <ul className="checks">
          {open.map((r) => (
            <CheckRow key={r.id} r={r} />
          ))}
        </ul>
      ) : null}
      {metRows.length ? (
        <details className="checks-met" open={open.length === 0} data-testid="checkpoints-met">
          <summary>
            <Icon name="chev" className="icon chev" />
            {metRows.length} met
          </summary>
          <ul className="checks">
            {metRows.map((r) => (
              <CheckRow key={r.id} r={r} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

// ------------------------------------------------------- health report
const SEVERITY: Record<BandMark["tone"], number> = { good: 0, none: 0, watch: 1, stop: 2 };

/**
 * The shaded Watch / Stop zones of a band, from the server's marks only. A mark says where a
 * zone starts; the zone runs away from the calm part of the scale up to the next mark or the
 * end. The calm part is the server's "good" mark when it sends one, else the gap between
 * marks that the severities fall towards (low end for a one-sided scale, the middle of a
 * two-sided one such as fuel trims).
 */
function bandZones(band: HealthBand): { from: number; to: number; tone: "watch" | "stop" }[] {
  const marks = [...band.marks].filter((m) => m.at >= band.min && m.at <= band.max).sort((a, b) => a.at - b.at);
  const hot = marks.filter((m) => SEVERITY[m.tone] > 0);
  if (!hot.length) return [];
  const calm = marks.find((m) => m.tone === "good");
  let pivot: number; // index into `hot`: marks before it shade down, marks from it shade up
  if (calm) {
    pivot = hot.filter((m) => m.at < calm.at).length;
  } else {
    const fits = (g: number) =>
      hot.slice(0, g).every((m, i, a) => i === 0 || SEVERITY[a[i - 1].tone] >= SEVERITY[m.tone]) &&
      hot.slice(g).every((m, i, a) => i === 0 || SEVERITY[a[i - 1].tone] <= SEVERITY[m.tone]);
    const candidates = Array.from({ length: hot.length + 1 }, (_, g) => g).filter(fits);
    // The calmest gap: the mildest marks on both sides of it (an open end counts as calm).
    const edgeSev = (g: number) => (g > 0 ? SEVERITY[hot[g - 1].tone] : 0) + (g < hot.length ? SEVERITY[hot[g].tone] : 0);
    pivot = candidates.sort((a, b) => edgeSev(a) - edgeSev(b) || a - b)[0] ?? 0;
  }
  const zones: { from: number; to: number; tone: "watch" | "stop" }[] = [];
  hot.forEach((m, i) => {
    const tone = m.tone as "watch" | "stop";
    if (i >= pivot) zones.push({ from: m.at, to: i + 1 < hot.length ? hot[i + 1].at : band.max, tone });
    else zones.push({ from: i > 0 ? hot[i - 1].at : band.min, to: m.at, tone });
  });
  return zones;
}

function BandBar({ band, label }: { band: HealthBand; label: string }) {
  const span = band.max - band.min;
  if (!(span > 0)) return null;
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - band.min) / span) * 100));
  const unit = band.unit ? ` ${band.unit}` : "";
  const marks = band.marks.filter((m) => m.at >= band.min && m.at <= band.max);
  // The one label under the bar names where trouble starts ("Watch from 0.56"), never a "good" mark:
  // a bare "Watch 0.56" beside an OK dot read as the verdict.
  const nearest = marks
    .filter((m) => m.tone === "watch" || m.tone === "stop")
    .reduce<BandMark | null>((best, m) => (!best || Math.abs(m.at - band.value) < Math.abs(best.at - band.value) ? m : best), null);
  const markText = (m: BandMark) => (m.label.includes(String(m.at)) ? m.label : `${m.label} ${m.at}${unit}`);
  const fromText = (m: BandMark) => `${m.tone === "stop" ? "Stop" : "Watch"} from ${m.at}${unit}`;
  const at = pos(band.value);
  const near = nearest ? pos(nearest.at) : 0;
  return (
    <div
      className="band"
      role="img"
      data-testid="health-band"
      data-value={band.value}
      aria-label={`${label}: ${band.value}${unit} on a scale from ${band.min} to ${band.max}${unit}.${
        marks.length ? ` Marks: ${marks.map(markText).join(", ")}.` : ""
      }`}
      title={`Scale from ${band.source}`}
    >
      <div className="band-track">
        {bandZones(band).map((z) => (
          <span key={`${z.from}-${z.to}`} className={`band-zone ${z.tone}`} style={{ left: `${pos(z.from)}%`, width: `${pos(z.to) - pos(z.from)}%` }} />
        ))}
        {marks.map((m) => (
          <span key={`${m.at}-${m.label}`} className={`band-mark ${m.tone}`} style={{ left: `${pos(m.at)}%` }} title={markText(m)} />
        ))}
        <span className="band-dot" style={{ left: `${at}%` }} title={`${band.value}${unit}`} />
      </div>
      {nearest ? (
        <span className={`band-label ${nearest.tone}${near > 75 ? " end" : near < 25 ? " start" : ""}`} style={{ left: `${near}%` }} aria-hidden="true">
          {fromText(nearest)}
        </span>
      ) : null}
    </div>
  );
}

export function HealthCard({ report }: { report: HealthReport }) {
  const groups = new Map<string, HealthReport["rows"]>();
  report.rows.forEach((r) => groups.set(r.system, [...(groups.get(r.system) ?? []), r]));
  return (
    <section className="card" data-testid="health">
      <h3 className="card-h">
        <Icon name="gauge" />
        Health report
      </h3>
      {report.line ? <p className="small">{report.line}</p> : null}
      <div className="health">
        {[...groups.entries()].map(([system, rows]) => (
          <div className="hgroup" key={system}>
            <div className="hsys">{system}</div>
            {rows.map((r) => (
              <div className="hrow" key={r.id} data-check={r.id}>
                <span className="hlabel">{r.label}</span>
                <span className="hval">{r.value}</span>
                <Pill tone={r.tone} word={r.word} />
                {/* A Can't tell row has no reading to put on a scale. */}
                {r.band && r.tone !== "none" ? <BandBar band={r.band} label={r.label} /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------- the Calibration result
const CEILING_WORD: Record<string, string> = { good: "Can show", watch: "Answered", none: "Can't tell yet" };

export function CalibrationResultCard({ card }: { card: CalibrationCard }) {
  const tone = card.lines[2]?.tone ?? "none";
  return (
    <section className="card" data-testid="calibration" data-status={card.status}>
      <h3 className="card-h">
        <Icon name="gauge" />
        <span className="grow">Can more boost show?</span>
        <Pill tone={tone} word={CEILING_WORD[tone] ?? CEILING_WORD.none} />
      </h3>
      <div className="health">
        <div className="hgroup">
          {card.lines.map((line) => (
            <div className="hrow" key={line.label} data-line={line.label}>
              <span className="hlabel">{line.label}</span>
              <span className="hval">{line.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------- the premium-fuel test
export function FuelTestCard({ test }: { test: FuelTest }) {
  return (
    <section className="card" data-testid="fuel-test">
      <h3 className="card-h">
        <Icon name="gauge" />
        <span className="grow">Premium fuel test</span>
        <Pill tone={test.status === "measured" ? "good" : "none"} word={test.status === "measured" ? "Measured" : "Can't tell yet"} />
      </h3>
      <p>{test.line}</p>
      {test.pairs.length ? (
        <ul className="checks">
          {test.pairs.map((p) => (
            <li key={`${p.a}-${p.b}`}>
              <span className="tick na" aria-hidden="true">
                <Icon name="route" />
              </span>
              <span className="label">
                {p.fuelA} vs {p.fuelB}
              </span>
              <span className="val">
                {p.kcPeakA} / {p.kcPeakB} · {p.iatGap} °C apart
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// ------------------------------------------------------- the map tour
const FAMILY_LOOK: Record<MapTour["families"][number]["status"], { word: string; tone: string; icon: string }> = {
  "this-round": { word: "This round", tone: "good", icon: "zap" },
  locked: { word: "Locked", tone: "watch", icon: "lock" },
  fine: { word: "No change needed", tone: "none", icon: "check" },
  "read-only": { word: "Read-only", tone: "none", icon: "lock" },
};

const STRIP_ORDER: MapTour["families"][number]["status"][] = ["this-round", "locked", "fine", "read-only"];
const STRIP_WORD: Record<MapTour["families"][number]["status"], string> = {
  "this-round": "This round",
  locked: "Locked",
  fine: "No change",
  "read-only": "Read-only",
};

/** How many families sit in each status: a segmented bar, with the counts and words beside it. */
function TourStrip({ families }: { families: MapTour["families"] }) {
  const counts = STRIP_ORDER.map((status) => ({ status, n: families.filter((f) => f.status === status).length })).filter((c) => c.n);
  if (!counts.length) return null;
  const said = counts.map((c) => `${c.n} ${STRIP_WORD[c.status]}`).join(", ");
  return (
    <div className="tour-strip" data-testid="tour-strip">
      <div className="tour-bar" role="img" aria-label={`Table families: ${said}`}>
        {counts.map((c) => (
          <span key={c.status} className={`seg-${c.status}`} style={{ flexGrow: c.n }} />
        ))}
      </div>
      <ul className="tour-counts" aria-hidden="true">
        {counts.map((c) => (
          <li key={c.status} data-status={c.status}>
            <i className={`seg-${c.status}`} />
            <b>{c.n}</b> {STRIP_WORD[c.status]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MapTourCard({
  tour,
  plan,
  housing,
  onAsk,
  onView,
  busy,
}: {
  tour: MapTour;
  plan?: FlashPlan | null;
  housing?: HousingOption | null;
  onAsk: (question: string) => void;
  onView: (table: string) => void;
  busy: boolean;
}) {
  return (
    <section className="section" data-testid="flash-plan" data-kind={plan?.kind}>
      <h3 className="card-h">
        <Icon name="wrench" />
        Your map, table by table
      </h3>
      <p>{tour.headline}</p>
      {plan?.route === "preset" ? (
        <p className="small" data-testid="housing-route">
          {housing?.option ? (
            <>
              Whenever you flash an edited map again: <b>MAF Scaling → {housing.option}</b>. {housing.detail}
            </>
          ) : (
            housing?.detail ?? "Answer which intake housing is fitted, and I add the MAF Scaling option for it."
          )}
        </p>
      ) : null}
      {plan?.blocked ? (
        <p className="small" data-testid="blocked">
          Checked twice before you saw it: {plan.blocked.disagree ? "the two checks disagreed" : "both checks refused it"}. {plan.blocked.reason}
        </p>
      ) : null}
      <TourStrip families={tour.families} />
      <ol className="opt-list tour" data-testid="map-tour">
        {tour.families.map((f) => {
          const s = FAMILY_LOOK[f.status] ?? FAMILY_LOOK.fine;
          const body = (
            <>
              <span className="why">{f.what}</span>
              <span className="unlock">
                {f.reason}
                {f.unlocks ? <> Unlocks when: {f.unlocks}</> : null}
              </span>
              <span className="tour-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  title={busy ? "Wait for this reply to finish" : undefined}
                  data-testid={`tour-ask-${f.family}`}
                  onClick={() => onAsk(`Walk me through the ${f.title} tables on my car: what they do, my values, and what changing them would do.`)}
                >
                  <Icon name="help" />
                  Explain these tables
                </button>
                {f.tables.length ? (
                  <button type="button" className="btn ghost" data-testid={`tour-view-${f.family}`} onClick={() => onView(f.tables[0])}>
                    <Icon name="chart" />
                    View {f.tables.length > 1 ? `the ${f.tables.length} tables` : "the table"} (2D / 3D)
                  </button>
                ) : null}
              </span>
            </>
          );
          if (f.status === "this-round") {
            return (
              <li key={f.family} className="opt open" data-family={f.family} data-status={f.status}>
                <span className="ico">
                  <Icon name={s.icon} />
                </span>
                <span>
                  <b>{f.title}</b> <Pill tone={s.tone} word={s.word} />
                </span>
                {body}
              </li>
            );
          }
          return (
            <li key={f.family} className="opt fold" data-family={f.family} data-status={f.status}>
              <details>
                <summary>
                  <span className="ico">
                    <Icon name={s.icon} />
                  </span>
                  <b className="grow">{f.title}</b>
                  <Pill tone={s.tone} word={s.word} />
                  <Icon name="chev" className="icon chev" />
                </summary>
                <div className="fold-body">{body}</div>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ------------------------------------------------------- the drive brief
export function DriveBriefCard({ brief }: { brief: DriveBrief | null | undefined }) {
  if (!brief) return null;
  return (
    <section className="card next" data-testid="log-guide">
      <div className="card-h" style={{ marginBottom: 0 }}>
        <Icon name="route" />
        <span className="grow">Drive brief</span>
        <Pill tone="none" word="About 20 min" />
      </div>
      <h3>{brief.title}</h3>
      <p className="small">{brief.intro}</p>
      {brief.sections.map((section, i) => (
        <div key={section.title} className="brief-sec">
          <div className="sub-h">
            {i + 1}. {section.title}
          </div>
          <ul className="brief-steps">
            {section.steps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
      {brief.gauges?.rows.length ? (
        <>
          <div className="sub-h">Watch these live while you drive</div>
          <GaugeTableView table={brief.gauges} />
        </>
      ) : null}
      <div className="sub-h">Checkpoints I'll read your log against</div>
      <ul className="checks plain">
        {brief.checkpoints.map((label) => (
          <li key={label}>
            {/* An empty circle: nothing is read until a log comes in. */}
            <span className="tick empty" aria-hidden="true" />
            <span className="label">{label}</span>
          </li>
        ))}
      </ul>
      <div className="proves">
        <span>
          <b>Then:</b> export the log from TunerView as CSV and attach it here with <b>+</b>, or drop the file on this page.
        </span>
      </div>
    </section>
  );
}
