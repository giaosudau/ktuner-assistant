"use client";

/**
 * The tuning shop's cards (tuning-shop D4-D6): did your log meet the brief, the health report,
 * the whole map at a high level, and the drive brief itself. Every row is the server's; the
 * cards only lay it out. A family in the map tour can be opened as a question to the tuner.
 */
import type { FuelTest } from "../lib/api";
import type { Checkpoint, DriveBrief, FlashPlan, HealthReport, HousingOption, MapTour } from "../lib/types";
import { GaugeTableView } from "./Cards";
import { Icon } from "./Icons";
import { Pill } from "./Pill";

// ------------------------------------------------------- log checkpoints
export function CheckpointsCard({ rows }: { rows: Checkpoint[] }) {
  if (!rows.length) return null;
  const met = rows.filter((r) => r.met === true).length;
  return (
    <section className="card" data-testid="checkpoints">
      <h3 className="card-h">
        <Icon name="route" />
        <span className="grow">Did this log meet the brief?</span>
        <span className="muted small-count">
          {met} of {rows.length}
        </span>
      </h3>
      <ul className="checks">
        {rows.map((r) => (
          <li key={r.id} data-met={String(r.met)}>
            <span className={`tick ${r.met === true ? "yes" : r.met === false ? "no" : "na"}`} aria-hidden="true">
              <Icon name={r.met === true ? "check" : r.met === false ? "x" : "info"} />
            </span>
            <span className="label">{r.label}</span>
            <span className="val">{r.value}</span>
            <span className="sr-only">{r.met === true ? "met" : r.met === false ? "not met" : "can't tell"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------- health report
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
              </div>
            ))}
          </div>
        ))}
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
      <ol className="opt-list tour" data-testid="map-tour">
        {tour.families.map((f) => {
          const s = FAMILY_LOOK[f.status] ?? FAMILY_LOOK.fine;
          return (
            <li key={f.family} className={`opt${f.status === "this-round" ? " open" : ""}`} data-family={f.family} data-status={f.status}>
              <span className="ico">
                <Icon name={s.icon} />
              </span>
              <span>
                <b>{f.title}</b> <Pill tone={s.tone} word={s.word} />
              </span>
              <span className="why">{f.what}</span>
              <span className="unlock">
                {f.reason}
                {f.unlocks ? <> Unlocks when: {f.unlocks}</> : null}
              </span>
              <span className="unlock">
                <button
                  type="button"
                  className="link-btn"
                  disabled={busy}
                  data-testid={`tour-ask-${f.family}`}
                  onClick={() => onAsk(`Walk me through the ${f.title} tables on my car: what they do, my values, and what changing them would do.`)}
                >
                  Explain these tables
                </button>
                {f.tables.length ? (
                  <>
                    {" · "}
                    <button type="button" className="link-btn" data-testid={`tour-view-${f.family}`} onClick={() => onView(f.tables[0])}>
                      View {f.tables.length > 1 ? `the ${f.tables.length} tables` : "the table"} (2D / 3D)
                    </button>
                  </>
                ) : null}
              </span>
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
            <span className="tick na" aria-hidden="true">
              <Icon name="check" />
            </span>
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
