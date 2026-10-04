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
}: {
  step: NextStep;
  acted?: string;
  busy: boolean;
  onFlash: FlashAct;
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

      {ktuner?.kind === "change" ? <KTunerCard card={ktuner} acted={acted} busy={busy} onFlash={onFlash} /> : null}
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
const FIELDS: { key: keyof Omit<CarProfile, "parts">; label: string }[] = [
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
}: {
  draft: ProfileDraft;
  spec: ProfileSpec | null;
  saved?: string;
  busy: boolean;
  onSave: (fields: CarProfile) => void;
}) {
  const [fields, setFields] = useState<CarProfile>({ ...draft.fields, parts: [...draft.fields.parts] });
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
        </div>
      </section>
    );
  }
  const toggle = (part: string) =>
    setFields((f) => ({ ...f, parts: f.parts.includes(part) ? f.parts.filter((p) => p !== part) : [...f.parts, part] }));
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
      {draft.missing.length ? (
        <p className="small" style={{ marginTop: 12 }} data-testid="setup-missing">
          Still to say: {draft.missing.join(", ")}.
        </p>
      ) : null}
      <div className="btn-row">
        <span className="meta">A changed parts list is saved as an Install with today's date.</span>
        <button type="button" className="btn primary" data-testid="setup-confirm" disabled={busy} onClick={() => onSave(fields)}>
          Save to my car
        </button>
      </div>
    </section>
  );
}
