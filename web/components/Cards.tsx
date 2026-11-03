"use client";

/**
 * The generative-UI cards an assistant message can carry, in the order a reply
 * reads: the report, what this Drive settled, a question only the owner can
 * answer, what can change now, and the one Next step (with the plan to type when
 * it is a Flash). Every word and number comes from the server; these only lay it
 * out.
 */
import { useState } from "react";

import type {
  CarProfile,
  GaugeTable,
  NextStep,
  OwnerQuestion,
  ProfileDraft,
  ProfileSpec,
  ReplyCard,
  SettledStep,
} from "../lib/types";
import { Icon } from "./Icons";
import { KTunerCard, UndoFlash, type FlashAct } from "./KTunerCard";
import { Pill, VerdictPill } from "./Pill";
import { partName } from "./Sidebar";

// ------------------------------------------------------------------ report
export function ReportCard({ card, fileName }: { card: ReplyCard; fileName: string }) {
  return (
    <section className="card" data-testid="reply-card" aria-label="Drive report">
      <div className="report-top">
        <VerdictPill verdict={card.verdict} />
        <span className="file" title={fileName}>
          {fileName}
        </span>
      </div>
      {card.numbers?.length ? (
        <div className="stats" data-testid="numbers">
          {card.numbers.map((t) => (
            <div className="stat" key={t.label}>
              <b>
                {t.value}
                {t.unit ? <small>{t.unit}</small> : null}
              </b>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {card.mapVersion ? (
        <div className="report-foot" data-testid="map-version" data-version={card.mapVersion.version}>
          <span>{card.mapVersion.line}</span>
          {card.mapVersion.note ? <span>{card.mapVersion.note}</span> : null}
        </div>
      ) : null}
      {card.readback ? (
        <div className={`note-line${card.readback.state === "mismatch" ? " stop" : ""}`} data-testid="readback">
          <Icon name={card.readback.state === "mismatch" ? "alert" : "check"} />
          <span>{card.readback.line}</span>
        </div>
      ) : null}
      {card.wasted ? (
        <div className="note-line" data-testid="wasted">
          <Icon name="info" />
          <span>{card.wasted}</span>
        </div>
      ) : null}
    </section>
  );
}

// ----------------------------------------------------- what this Drive settled
export function SettledCard({ rows }: { rows: SettledStep[] }) {
  if (!rows.length) return null;
  return (
    <section className="section" data-testid="settled">
      <h3 className="card-h">
        <Icon name="history" />
        Since last time
      </h3>
      <div className="rows">
        {rows.map((row) => (
          <div className="r" key={row.key} data-status={row.status}>
            <Pill tone={row.tone} word={row.word} />
            <span>
              <b>{row.title}.</b> <span className="why">{row.why}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------- a question for the owner
export function QuestionCard({
  question,
  onAnswer,
  busy,
}: {
  question: OwnerQuestion;
  onAnswer: (choiceId: string) => void;
  busy: boolean;
}) {
  const [changing, setChanging] = useState(false);
  const saved = changing ? null : (question.choices.find((c) => c.id === question.answer) ?? null);
  return (
    <section className={`card${saved ? "" : " ask-card"}`} data-testid={`question-${question.kind}`} data-answered={saved?.id}>
      <h3 className="card-h">
        <Icon name="help" />
        {question.question}
      </h3>
      {saved ? (
        <div className="answered">
          <Icon name="check" />
          You said: <b>{saved.label}</b>
          <button type="button" className="link-btn" data-testid={`change-${question.kind}`} onClick={() => setChanging(true)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <p className="small">Only you know this. Your answer changes the next step.</p>
          <div className="chips">
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="chip"
                data-testid={`answer-${question.kind}-${choice.id}`}
                disabled={busy}
                onClick={() => {
                  setChanging(false);
                  onAnswer(choice.id);
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------- the one Next step
const KIND: Record<string, { word: string; icon: string }> = {
  flash: { word: "Flash", icon: "zap" },
  change: { word: "Flash", icon: "zap" },
  watch: { word: "Watch", icon: "gauge" },
  drive: { word: "Drive", icon: "route" },
  none: { word: "Nothing to do", icon: "check" },
};

export function GaugeTableView({ table }: { table: GaugeTable }) {
  return (
    <table className="gauges" data-testid="gauges">
      <thead>
        <tr>
          {table.columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row.gauge} data-gauge={row.gauge}>
            <td>{row.gauge}</td>
            <td data-l="OK">{row.ok}</td>
            <td data-l="If you see">{row.see}</td>
            <td data-l="Then">{row.then}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NextStepCard({
  step,
  acted,
  busy,
  onFlash,
  onView,
}: {
  step: NextStep;
  acted?: string;
  busy: boolean;
  onFlash: FlashAct;
  onView?: (table: string) => void;
}) {
  const k = KIND[step.kind] ?? KIND.none;
  const ktuner = step.kind === "flash" ? step.flashPlan?.ktunerCard : null;
  return (
    <section className="card next" data-testid="next-step" data-kind={step.kind} data-key={step.key}>
      <div className="card-h" style={{ marginBottom: 0 }}>
        <Icon name={k.icon} />
        <span className="grow">Next step{step.same ? ", same as last time" : ""}</span>
        <Pill tone="none" word={k.word} />
      </div>
      <h3>{step.title}</h3>
      {step.body ? <p>{step.body}</p> : null}

      {ktuner?.kind === "change" ? (
        <>
          {onView && ktuner.groups[0]?.tables[0] ? (
            <button type="button" className="btn ghost" style={{ margin: "4px 0 10px" }} data-testid="review-table" onClick={() => onView(ktuner.groups[0].tables[0])}>
              <Icon name="chart" />
              Review the change in the whole table (2D / 3D)
            </button>
          ) : null}
          <KTunerCard card={ktuner} acted={acted} busy={busy} onFlash={onFlash} />
        </>
      ) : null}
      {ktuner?.kind === "undo" ? <UndoFlash card={ktuner} acted={acted} busy={busy} onFlash={onFlash} /> : null}

      {step.recipe?.steps.length ? (
        <>
          <div className="sub-h">{step.kind === "drive" ? "The drive to log" : "What to do"}</div>
          {step.recipe.intro && !step.body?.includes(step.recipe.intro) ? <p className="small">{step.recipe.intro}</p> : null}
          <ol className="numbered">
            {step.recipe.steps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </>
      ) : null}

      {step.gauges?.rows.length ? (
        <>
          <div className="sub-h">Watch live in TunerView while you drive</div>
          <GaugeTableView table={step.gauges} />
        </>
      ) : null}

      {step.also ? (
        <div className="also" data-testid="also-seen">
          <b>Also seen today: {step.also.title}</b>
          {step.also.why ? <p style={{ margin: "4px 0 0" }}>{step.also.why}</p> : null}
          {step.also.steps.length ? (
            <ol className="numbered" style={{ marginTop: 8 }}>
              {step.also.steps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : null}
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            Upload when: {step.also.settlesOn}.
          </div>
        </div>
      ) : null}

      <div className="proves">
        {step.proves && step.proves !== "nothing" ? (
          <span>
            <b>Your next upload proves:</b> {step.proves}.
          </span>
        ) : null}
        <span>
          <b>Upload when:</b> {step.upload}.
        </span>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ the Car profile
const LOGGER_CHANNELS: { key: "logger_afr_command" | "logger_maf_hz"; label: string }[] = [
  { key: "logger_afr_command", label: "AFR Command" },
  { key: "logger_maf_hz", label: "MAF Hz" },
];

/** The owner's three honest answers about a TunerView channel. */
const LOGGER_CHOICES: { value: boolean | null; id: string; word: string }[] = [
  { value: true, id: "yes", word: "Offered" },
  { value: false, id: "no", word: "Not offered" },
  { value: null, id: "unknown", word: "Haven’t looked" },
];

const CAL_NEED = "Needed for: can more boost show?";

/**
 * The Calibration fields still unset, in the order the card shows them. This only lists the
 * owner's own input back to them; it reads no log and decides nothing.
 */
function calibrationGaps(f: CarProfile): string[] {
  const gaps: string[] = [];
  if (f.pedal_full_pct == null) gaps.push("Pedal full reading");
  if (f.logger_afr_command == null) gaps.push("AFR Command");
  if (f.logger_maf_hz == null) gaps.push("MAF Hz");
  if (f.logger_max_rate_hz == null) gaps.push("Fastest logging rate");
  return gaps;
}

/** A field's label row: the label, then a status word (amber while unset, green once said). */
function CalLabel({ label, word, set, htmlFor, id }: { label: string; word: string; set: boolean; htmlFor?: string; id?: string }) {
  const head = (
    <>
      <span className="cal-name">{label}</span>
      <Pill tone={set ? "good" : "watch"} word={word} />
    </>
  );
  return htmlFor ? (
    <label className="cal-head" htmlFor={htmlFor} id={id}>
      {head}
    </label>
  ) : (
    <span className="cal-head" id={id}>
      {head}
    </span>
  );
}

/** Three-way choice as a radio group of 44 px buttons; arrow keys move the choice. */
function Segmented({
  name,
  labelledBy,
  value,
  onChange,
  testId,
}: {
  name: string;
  labelledBy: string;
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
  testId: string;
}) {
  const current = LOGGER_CHOICES.findIndex((c) => c.value === (value ?? null));
  const pick = (i: number, group: HTMLElement | null) => {
    const n = LOGGER_CHOICES.length;
    const next = (i + n) % n;
    onChange(LOGGER_CHOICES[next].value);
    group?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };
  return (
    <div className="seg" role="radiogroup" aria-labelledby={labelledBy} data-testid={testId} data-value={LOGGER_CHOICES[current].id}>
      {LOGGER_CHOICES.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          name={name}
          aria-checked={i === current}
          tabIndex={i === current ? 0 : -1}
          className={i === current ? "on" : ""}
          data-testid={`${testId}-${c.id}`}
          onClick={() => onChange(c.value)}
          onKeyDown={(event) => {
            const group = event.currentTarget.parentElement;
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              event.preventDefault();
              pick(i + 1, group);
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              event.preventDefault();
              pick(i - 1, group);
            }
          }}
        >
          {c.word}
        </button>
      ))}
    </div>
  );
}

const FIELDS: {
  key: keyof Omit<
    CarProfile,
    "parts" | "eliminate_artificial_kc_rise" | "pedal_full_pct" | "pedal_full_at" | "logger_afr_command" | "logger_maf_hz" | "logger_max_rate_hz"
  >;
  label: string;
}[] = [
  { key: "model", label: "Model" },
  { key: "engine", label: "Engine" },
  { key: "transmission", label: "Gearbox" },
  { key: "fuel", label: "Fuel" },
  { key: "climate", label: "Where you drive" },
  { key: "basemap", label: "KTuner basemap on the car" },
];

export function ProfileCard({
  draft,
  spec,
  saved,
  busy,
  onSave,
  onEdit,
}: {
  draft: ProfileDraft;
  spec: ProfileSpec | null;
  saved?: string;
  busy: boolean;
  onSave: (fields: CarProfile) => void;
  /** Open the one car editor (shown on a saved card). */
  onEdit?: () => void;
}) {
  const [fields, setFields] = useState<CarProfile>({ ...draft.fields, parts: [...draft.fields.parts] });
  if (saved === "Replaced by the card below.") {
    return (
      <section className="card" data-testid="profile-card-replaced">
        <p className="small muted">This car card was replaced by the one below.</p>
      </section>
    );
  }
  if (saved) {
    return (
      <section className="card" data-testid="profile-card">
        <div className="pf-saved" data-testid="setup-saved">
          <Icon name="check" />
          <span>
            <b>{[fields.model, fields.transmission, fields.fuel].filter(Boolean).join(" · ")}</b>
            <br />
            <span className="muted">
              {fields.parts.length ? fields.parts.map(partName).join(", ") : "No parts listed"} · {fields.basemap}
            </span>
          </span>
          {onEdit ? (
            <button type="button" className="btn ghost" data-testid="profile-card-edit" disabled={busy} onClick={onEdit} style={{ marginLeft: "auto" }}>
              <Icon name="edit" />
              Edit
            </button>
          ) : null}
        </div>
      </section>
    );
  }
  const toggle = (part: string) =>
    setFields((f) => ({ ...f, parts: f.parts.includes(part) ? f.parts.filter((p) => p !== part) : [...f.parts, part] }));
  const gaps = calibrationGaps(fields);
  return (
    <section className="card" data-testid="setup-form">
      <h3 className="card-h">
        <Icon name="car" />
        <span className="grow">Your car</span>
      </h3>
      <p className="small">I filled this from your words. Fix anything I misread, then save. Nothing is saved before you do.</p>
      <div className="pf-grid">
        {FIELDS.map(({ key, label }) => (
          <label className="field" key={key}>
            <span>
              {label}
              {draft.prefilled.includes(key) ? <span className="pre"> · from the map I hold</span> : null}
            </span>
            <input
              type="text"
              value={fields[key]}
              data-testid={`setup-field-${key}`}
              onChange={(event) => setFields((f) => ({ ...f, [key]: event.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="pf-parts field">
        <span>Parts fitted</span>
        <div className="chips">
          {(spec?.parts ?? fields.parts).map((part) => (
            <button
              key={part}
              type="button"
              className={`chip${fields.parts.includes(part) ? " on" : ""}`}
              aria-pressed={fields.parts.includes(part)}
              data-testid={`setup-part-${part}`}
              onClick={() => toggle(part)}
            >
              {fields.parts.includes(part) ? <Icon name="check" /> : <Icon name="plus" />}
              {partName(part)}
            </button>
          ))}
        </div>
      </div>
      <label className="pf-toggle">
        <input
          type="checkbox"
          checked={fields.eliminate_artificial_kc_rise === true}
          data-testid="setup-field-eliminate_artificial_kc_rise"
          onChange={(event) => setFields((f) => ({ ...f, eliminate_artificial_kc_rise: event.target.checked }))}
        />
        <span>
          &ldquo;Eliminate Artificial Knock Control Rise&rdquo; is ticked on my map
          <span className="meta">Unticked, the ECU raises Knock Control above 5,200 rpm on purpose, so I don&rsquo;t count those rises.</span>
        </span>
      </label>

      <div className="pf-cal" data-testid="setup-calibration">
        <div className="sub-h">For the Calibration drive</div>
        <div className="field cal-field">
          <CalLabel
            label="Pedal full reading (TPS %)"
            htmlFor="pf-pedal"
            set={fields.pedal_full_pct != null}
            word={fields.pedal_full_pct != null ? `${fields.pedal_full_pct} %` : "Not read yet"}
          />
          <span className="cal-need">{CAL_NEED}</span>
          <input
            id="pf-pedal"
            type="number"
            inputMode="decimal"
            min={60}
            max={130}
            step="any"
            placeholder="Not read yet"
            value={fields.pedal_full_pct ?? ""}
            data-testid="setup-field-pedal_full_pct"
            onChange={(event) => setFields((f) => ({ ...f, pedal_full_pct: event.target.value === "" ? null : Number(event.target.value) }))}
          />
          <span className="meta">
            Parked, ignition on, engine off: press the pedal to the floor and read TPS in TunerView. A pull counts as floored from 90 % of it.
          </span>
        </div>

        <div className="cal-group-h">What TunerView can log on this car</div>
        {LOGGER_CHANNELS.map(({ key, label }) => {
          const choice = LOGGER_CHOICES.find((c) => c.value === (fields[key] ?? null)) ?? LOGGER_CHOICES[2];
          return (
            <div className="field cal-field" key={key}>
              <CalLabel label={label} id={`pf-${key}`} set={fields[key] != null} word={choice.word} />
              <span className="cal-need">{CAL_NEED}</span>
              <Segmented
                name={key}
                labelledBy={`pf-${key}`}
                value={fields[key]}
                testId={`setup-field-${key}`}
                onChange={(value) => setFields((f) => ({ ...f, [key]: value }))}
              />
            </div>
          );
        })}
        <div className="field cal-field">
          <CalLabel
            label="Fastest logging rate (a second)"
            htmlFor="pf-rate"
            set={fields.logger_max_rate_hz != null}
            word={fields.logger_max_rate_hz != null ? `${fields.logger_max_rate_hz} a second` : "Haven’t looked"}
          />
          <span className="cal-need">{CAL_NEED}</span>
          <input
            id="pf-rate"
            type="number"
            inputMode="decimal"
            min={1}
            max={50}
            step="any"
            placeholder={"Haven’t looked"}
            value={fields.logger_max_rate_hz ?? ""}
            data-testid="setup-field-logger_max_rate_hz"
            onChange={(event) => setFields((f) => ({ ...f, logger_max_rate_hz: event.target.value === "" ? null : Number(event.target.value) }))}
          />
        </div>
        <span className="meta">From TunerView&rsquo;s gauge list and rate menu. A gauge it doesn&rsquo;t offer is never asked for.</span>
      </div>
      {draft.missing.length ? (
        <p className="small" style={{ marginTop: 12 }} data-testid="setup-missing">
          Still to say: {draft.missing.join(", ")}.
        </p>
      ) : null}
      {gaps.length ? (
        <p className="pf-gaps" data-testid="setup-calibration-missing">
          <Icon name="alert" />
          <span>
            Still to read: {gaps.join(", ")}. Your next drive can&rsquo;t answer &ldquo;can more boost show?&rdquo; without them.
          </span>
        </p>
      ) : null}
      <div className="btn-row pf-save">
        <span className="meta">A changed parts list is saved as an Install with today's date.</span>
        <button type="button" className="btn primary" data-testid="setup-confirm" disabled={busy} onClick={() => onSave(fields)}>
          Save to my car
        </button>
      </div>
    </section>
  );
}
