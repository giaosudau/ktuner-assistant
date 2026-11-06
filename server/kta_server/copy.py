"""The built-in reply: every word the owner reads until the model takes over.

One person, in a car park, on a phone, afraid they have broken something. So:

* **The first sentence answers "am I hurting it?"** with *this* Drive's own
  numbers, in the same sentence. Never a summary, never a list.
* The **one diagnosed cause** in one sentence with its evidence, or nothing.
* Then, in this order and nothing else: the four numbers as a compact row
  (intake air while moving, Knock Control start → peak, worst fuel trim, hard
  pulls), the **Map version** this Drive ran on as one quiet line
  ("on Map version 1 · Starter 21 Dual Tune 2", with a one-off footnote
  explaining what a Map version is on the owner's first Drive), the **Verdict**
  word, **what I asked last time** (each Open step this Drive settled, with its
  reason), the **Wasted drive** line when it settled none of them, the **Flash
  plan** headline, the collapsed harness steps, and **exactly one Next step** with
  its drive recipe or its gauge table and the Drive that will settle it.
* A **Too-short drive** gets `Nothing read: under a minute moving` and no
  Verdict word, because CONTEXT.md says a Too-short drive gets no verdict.
* Every reply states its window in the owner's words.
* The app **always knows** which Map a Drive ran on: Map version 1 is the KTuner
  basemap the owner gave it, active from the first Drive. "Not recorded" is never
  an answer here.

The **decisions** — which Open step settles how, and which one step comes next —
are the engine's (`KTA.carSettle`, `KTA.carNextStep`). This module only says them.
Gauge names are TunerView's own; every threshold arrives in `limits` from the
worker, so no number is decided here.

Only the words of `CONTEXT.md` are used. KTuner's own spellings are kept:
Starter 21 Dual Tune 2, MAF Scaling, Turbo Pressure, Knock Control, IAT2, DIFP,
Transmission Temperature. No number here is computed — every one arrives from
the worker with the limit it was read against.
"""

from __future__ import annotations

import math
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Mapping

from .config import REPO_ROOT
from . import profile as P
from .mapcheck import load_thresholds
from .profile import part_display

#: The owner-facing words the engine shares (`KTA.carWords`): one file, read here, never re-spelled.
_WORDS = load_thresholds(REPO_ROOT / "data" / "car-words.json")
MONTHS: list[str] = _WORDS["months"]
# The gauge names TunerView spells, for the dead-gauge step (KTuner's channel names).
CHANNEL_NAMES: dict[str, str] = _WORDS["channels"]


def channel_name(key: str) -> str:
    return CHANNEL_NAMES.get(key, key)


def join_names(names: list[str]) -> str:
    """`A, B and C` — the way a person reads a list out loud."""
    names = [n for n in names if n]
    if len(names) < 2:
        return "".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


# ---------------------------------------------------------------------------
# Number formatting, shared with the prototype's rules
# ---------------------------------------------------------------------------
def n(value: Any, decimals: int = 0, dash: str = "–") -> str:
    """A plain number, or a dash when the channel was not in the log."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return dash
    return f"{value:.{decimals}f}"


def sg(value: Any, decimals: int = 1) -> str:
    """A signed number with a real minus sign, the way the owner reads it."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return "–"
    sign = "−" if value < 0 else ("+" if value > 0 else "")
    return f"{sign}{abs(value):.{decimals}f}"


def plural(count: int, one: str, many: str) -> str:
    return one if count == 1 else many


def drive_stamp(drive_id: str | None) -> str:
    """`20260823-203853` → `23 Aug 20:38`. TunerView names are wall time already."""
    if not drive_id or "-" not in drive_id:
        return "–"
    date, _, clock = drive_id.partition("-")
    if len(date) != 8 or len(clock) != 6:
        return drive_id
    return f"{date[6:8]} {MONTHS[int(date[4:6]) - 1]} {clock[0:2]}:{clock[2:4]}"


def file_stamp(file_name: str) -> str:
    """`TunerView_20260901_081358.csv` → `01 Sep 08:13`."""
    stem = file_name[:-4] if file_name.lower().endswith(".csv") else file_name
    parts = stem.split("_")
    if len(parts) < 3 or len(parts[-1]) != 6:
        return file_name
    return drive_stamp(f"{parts[-2]}-{parts[-1]}")


def stamp_of(stamp: str | None) -> str:
    """`20260823-200000` → `23 Aug 20:00`.

    The engine hands over the stamp it already formatted for TunerView names, so
    no timezone lives in this module: one clock, one spelling of a time.
    """
    return drive_stamp(stamp) if stamp else ""


def stamp_day(ms: Any) -> str:
    """An epoch millisecond moment → `30 Aug`, on the owner's wall clock.

    TunerView names are Vietnam wall time, so the day is read +7 h: the same
    clock `drive_stamp` reads, without the hour and minute.
    """
    if isinstance(ms, bool) or not isinstance(ms, (int, float)):
        return "–"
    import datetime as _dt

    moment = _dt.datetime.fromtimestamp((ms + 7 * 3600 * 1000) / 1000, tz=_dt.timezone.utc)
    return f"{moment.day} {MONTHS[moment.month - 1]}"


# ---------------------------------------------------------------------------
# The Verdict word: OK / Watch / Stop / Can't tell (CONTEXT.md)
# ---------------------------------------------------------------------------
VERDICT_WORDS = {"good": "OK", "watch": "Watch", "stop": "Stop", "nodata": "Can't tell"}

# The lead-in of the first sentence, per Verdict. Short, and never "danger".
VERDICT_LEAD = {
    "good": "Engine healthy",
    "watch": "Nothing broken, but there is a Watch",
    "stop": "Stop driving hard",
    "nodata": "Can't tell from this drive",
}


def verdict_word(drive: Mapping[str, Any]) -> str | None:
    """The Verdict word, or None for a Too-short drive (it gets no verdict)."""
    if drive.get("tooShort"):
        return None
    return VERDICT_WORDS.get(str(drive.get("verdict")), "Can't tell")


def first_sentence(drive: Mapping[str, Any], limits: Mapping[str, Any]) -> str:
    """"Am I hurting it?" — answered with this Drive's own numbers, in one line.

    Shape: `<lead>: <mixture>, Knock Control peak <n>: costs about <n>° of
    timing, not damage[, worst fuel trim <n> %]`
    """
    if drive.get("tooShort"):
        return "Nothing read: under a minute moving"

    lead = VERDICT_LEAD.get(str(drive.get("verdict")), VERDICT_LEAD["nodata"])
    summary = drive.get("summary") or {}
    clauses: list[str] = []

    # A trim Stop reads wrong if the Fuel-quality score comes first: the trims
    # are the cause, so they lead. When the trims are inside ±5 % there is no
    # trim clause at all, and the sentence stays the shape the prototype fixed.
    trim = summary.get("trimWorst")
    trim_ok = lim(limits, "LIMITS.trim.good", 5)
    if trim is not None and abs(trim) > trim_ok:
        clauses.append(f"worst fuel trim {sg(trim, 1)} %")

    leanest = summary.get("mixLeanest")
    if leanest is not None:
        target = summary.get("mixTarget") or lim(limits, "LIMITS.mixture.target", None)
        clauses.append(
            f"full-throttle AFR {n(leanest, 1)} (map asks {n(target, 1)}, "
            f"lean limit {n(lim(limits, 'LIMITS.mixture.leanLimit', None), 1)})"
        )

    peak = summary.get("kcPeak")
    if peak is not None:
        deg = summary.get("timingCostDeg")
        cost = f"about {n(deg, 1)}° of timing" if (deg is None or deg >= 0.05) else "under 0.1° of timing"
        clauses.append(f"Knock Control peak {n(peak, 2)}: costs {cost}, not damage")

    if not clauses:
        return f"{lead}: not enough in this log to judge."
    return f"{lead}: " + ", ".join(clauses) + "."


def after_flash_note(drive: Mapping[str, Any]) -> str | None:
    """The after-flash pattern, in the owner's words.

    A Drive whose Fuel-quality score starts at or below 0.60 and settles to the
    Baseline is what a fresh flash does (engine `CAR_RULES.afterFlashStart`).
    That is reassurance, not an alarm, so it is said here instead of being
    silently exempted (ticket 02, PM note 2).
    """
    af = drive.get("afterFlash")
    if not af:
        return None
    start, end = af.get("start"), af.get("end")
    if start is None or end is None:
        return None
    return (
        f"Knock Control started at {n(start, 2)} and settled to your Baseline "
        f"({n(end, 2)}): that is what a fresh flash does."
    )


def four_numbers(drive: Mapping[str, Any]) -> list[dict[str, Any]]:
    """The four numbers as a compact row: intake air, Knock Control, trims, pulls."""
    summary = drive.get("summary") or {}
    return [
        {"label": "intake air, moving", "value": n(summary.get("iatMoving"), 0), "unit": "°C"},
        {
            "label": "Knock Control, start → peak",
            "value": f"{n(summary.get('kcStart'), 2)} → {n(summary.get('kcPeak'), 2)}",
            "unit": "",
        },
        {"label": "worst fuel trim", "value": sg(summary.get("trimWorst"), 1), "unit": "%"},
        {"label": "hard pulls", "value": n(summary.get("hardPulls"), 0), "unit": ""},
    ]


# ---------------------------------------------------------------------------
# The Map version line: which Map this Drive ran on, in the owner's words
# ---------------------------------------------------------------------------
# One quiet line, under the window and the four numbers: the Verdict sentence
# still comes first. It never reads "not recorded": a fresh car is on Map version
# 1 from its first Drive, so there is always an answer (CONTEXT.md: Map version).
#
# The first time the owner sees it, one short line says what a Map version *is*,
# and then the app stops explaining it.
MAP_VERSION_WHAT_IT_IS = (
    "A Map version is the map on your ECU: version 1 is the KTuner basemap you gave me, "
    "and each map you flash becomes the next version."
)


def map_version_line(drive: Mapping[str, Any]) -> str | None:
    """`on Map version 1 · Starter 21 Dual Tune 2`, or nothing when unknown.

    A Too-short Drive gets no line: it read nothing, and CONTEXT.md says it says
    exactly one thing. "Not recorded" is never a possible answer — the app always
    holds Map version 1, and every Drive names the version active when it started.
    """
    if drive.get("tooShort"):
        return None
    version = drive.get("map") or {}
    number, name = version.get("version"), version.get("name")
    if number is None or not name:
        return None
    return f"on Map version {number} · {name}"


def map_version_card(drive: Mapping[str, Any], first_drive: bool = False) -> dict[str, Any] | None:
    """The Map version line as the chat renders it, near the top of the card.

    `{ line, version, name, since, note }`. `note` explains what a Map version is
    on the first Drive the owner reads and is absent on every reply after that —
    a footnote under the line, never part of it, so the line stays quiet.
    """
    line = map_version_line(drive)
    if line is None:
        return None
    version = drive.get("map") or {}
    card = {
        "line": line,
        "version": version.get("version"),
        "name": version.get("name"),
        "since": version.get("since"),
        "kind": version.get("kind") or "ktuner-basemap",
    }
    if first_drive:
        card["note"] = MAP_VERSION_WHAT_IT_IS
    return card


def undo_named(plan: Mapping[str, Any] | None) -> str | None:
    """`Map version 1 · Starter 21 Dual Tune 2, flashed 23 Aug 20:00`, or None when no earlier version is held."""
    undo = (plan or {}).get("undo") or {}
    if not undo.get("known") or undo.get("version") is None:
        return None
    named = f"Map version {undo['version']} · {undo['name']}"
    when = stamp_of(undo.get("stamp"))
    return f"{named}, flashed {when}" if when else named


def undo_recipe(plan: Mapping[str, Any] | None) -> dict[str, Any]:
    """The Undo as three numbered steps (R2-4): save today's map, flash the one from before, prove it."""
    named = undo_named(plan)
    before = "the file you ran before this drive" + (f" ({named})" if named else "")
    return {
        "intro": "",
        "steps": [
            "In KTuner, save today's map under a new name so nothing is lost.",
            f"Open {before} and flash it.",
            "Drive 10 calm minutes (the Shakedown), then attach the log here.",
        ],
    }


def window_line(drives_read: list[str], read: int, too_short: bool = False) -> str:
    """Which Drives this reply read, in the owner's words.

    `drive windows are ticket 10` — for now it says which Drives it read. A
    Too-short Drive read nothing at all, so it says what the Car history still
    holds instead of pretending this Drive was one of them.
    """
    if too_short:
        held = f"{read} {plural(read, 'Drive', 'Drives')}"
        return f"nothing read — your Car history still holds {held}"
    if read <= 0:
        return "nothing read yet"
    if read == 1:
        return f"based on this Drive only ({drive_stamp(drives_read[-1]) if drives_read else '–'})"
    first = drive_stamp(drives_read[0]) if drives_read else "–"
    last = drive_stamp(drives_read[-1]) if drives_read else "–"
    if first == last:
        return f"based on your {read} {plural(read, 'Drive', 'Drives')} ({last})"
    return f"based on your {read} {plural(read, 'Drive', 'Drives')}, {first} to {last}"


def window_line_for(ids: list[str], since: dict[str, Any] | None = None) -> str:
    """Which Drives an answer is about, in the owner's words.

    The window is the latest Drive plus every Drive since the last Flash or
    Install, capped at 14 days. A bounded window names its change ("based on
    your 3 Drives since the Flash on 30 Aug"); an unbounded one reads exactly
    like `window_line`, so the same reply says the same thing either way.
    """
    ids = [i for i in (ids or []) if i]
    if not ids:
        return "nothing read yet"
    if since:
        kind = since.get("kind")
        if kind == "flash":
            change = "the Flash"
        else:
            change = f"the {part_display(str(since.get('part') or 'part'))} Install"
        day = stamp_day(since.get("time"))
        return f"based on your {len(ids)} {plural(len(ids), 'Drive', 'Drives')} since {change} on {day}"
    return window_line(ids, len(ids))


def window_card(window: dict[str, Any] | None) -> dict[str, Any]:
    """The window as the chat and `GET /api/state` read it.

    `{ driveIds, count, since: { kind, label, day } | None, line }`: one quiet
    line for the reply, and the ids behind it for anything that decides.
    """
    window = window or {}
    ids = [i for i in (window.get("ids") or []) if i]
    since = window.get("since")
    card: dict[str, Any] = {
        "driveIds": ids,
        "count": len(ids),
        "since": None,
        "line": window_line_for(ids, since if isinstance(since, dict) else None),
    }
    if isinstance(since, dict):
        card["since"] = {
            "kind": since.get("kind"),
            "label": (
                "the Flash"
                if since.get("kind") == "flash"
                else f"the {part_display(str(since.get('part') or 'part'))} Install"
            ),
            "day": stamp_day(since.get("time")),
        }
    return card


# ---------------------------------------------------------------------------
# What I asked last time: each Open step settled against this Drive
#
# The four words are the spec's, and none of them is a verdict on the owner:
# Done, Not yet, Still off, Can't tell yet. "Can't tell yet" is the one that has to
# earn its place, so it always carries the reason the Drive could not answer
# (too short, too cool, a dead gauge) — never a failure and never a "try again".
# ---------------------------------------------------------------------------
STEP_STATUS_WORD = {k: v["word"] for k, v in _WORDS["stepStatus"].items()}
# The same four as the pill the chat draws: OK, Watch, Stop, Can't tell.
STEP_STATUS_TONE = {k: v["tone"] for k, v in _WORDS["stepStatus"].items()}


def settled_rows(settled: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    """The steps this Drive settled, with their reason and the numbers in it."""
    rows = []
    for item in settled or []:
        status = str(item.get("status") or "")
        rows.append(
            {
                "key": item.get("key"),
                "title": item.get("title") or "",
                "status": status,
                "word": STEP_STATUS_WORD.get(status, "Can't tell yet"),
                "tone": STEP_STATUS_TONE.get(status, "none"),
                "why": item.get("why") or "",
            }
        )
    return rows


def step_words(steps: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    """Open steps for the web, each with the status word, its pill tone, already worded."""
    return [
        {
            **s,
            "word": STEP_STATUS_WORD.get(s.get("status"), "Not yet"),
            "tone": STEP_STATUS_TONE.get(s.get("status"), "watch"),
        }
        for s in steps or []
    ]


def wasted_line(wasted: Mapping[str, Any] | None) -> str | None:
    """A Drive that settled nothing, said once, kindly, with what would have.

    `This Drive settles nothing: it was too short (under a minute moving). A drive
    of 10 calm minutes would have settled the Undo.`

    One line, no scolding, and no count kept against the owner on screen.
    """
    if not wasted or not wasted.get("wasted"):
        return None
    reason = (wasted.get("reason") or "").strip()
    would = (wasted.get("would") or "").strip()
    proves = (wasted.get("proves") or "").strip()
    if not reason:
        return None
    line = f"This Drive settles nothing: {reason}."
    if would and proves:
        line += f" {would[:1].upper()}{would[1:]} would have settled {proves}"
        if wasted.get("withGauges"):
            line += ", with every gauge moving"
        line += "."
    return line


# ---------------------------------------------------------------------------
# The gauge table: what to look at while driving, in TunerView's own words
#
# Four columns — the gauge as TunerView spells it, OK, If you see, Then — which
# fit a phone only as one stacked row per gauge, so the chat draws it that way and
# lets it widen on a desktop. Every threshold comes from the worker (`limits`), so
# no number in this file is decided here.
# ---------------------------------------------------------------------------
GAUGE_COLUMNS = ["Gauge in TunerView", "OK", "If you see", "Then"]


def lim(limits: Mapping[str, Any], path: str, fallback: Any) -> Any:
    """One limit by the engine's own dotted name, e.g. `LIMITS.trim.good`."""
    node: Any = limits
    for part in path.split("."):
        node = node.get(part) if isinstance(node, Mapping) else None
    return fallback if node is None else node


def gauge_row(key: str, limits: Mapping[str, Any], dead: list[str] | None = None) -> dict[str, str] | None:
    """One gauge, the four cells the owner reads. `None` when there is no such row."""
    def at(path: str, fallback: Any) -> Any:
        return lim(limits, path, fallback)

    if key == "trims":
        return {
            "gauge": "STFT B1 + LTFT B1",
            "ok": f"within ±{n(at('LIMITS.trim.good', 5), 0)} %",
            "see": f"beyond ±{n(at('LIMITS.trim.watch', 10), 0)} %",
            "then": "Stop pulling. Drive home calm, upload.",
        }
    if key == "kc":
        return {
            "gauge": "Knock Control",
            "ok": f"at or under {n(at('LIMITS.score.watch', 0.56), 2)}",
            "see": f"above {n(at('LIMITS.score.noHard', 0.62), 2)}",
            "then": (
                "Ease off, and note what you were doing (rpm, heat, hill). "
                f"Up to {n(at('LIMITS.score.noHard', 0.62), 2)} costs about 1.3° of timing, not damage."
            ),
        }
    if key == "iat":
        return {
            "gauge": "IAT2",
            "ok": f"under {n(at('CAR_RULES.coolIat', 42), 0)} °C moving, under {n(at('DRIVE_LIMITS.pullIatGood', 48), 0)} °C when a pull starts",
            "see": f"over {n(at('DRIVE_LIMITS.pullIatGood', 48), 0)} °C",
            "then": "Hold a steady speed 1–2 min before the pull. A hot pull is not a test.",
        }
    if key == "afr":
        target = at("LIMITS.mixture.target", 11.0)
        return {
            "gauge": "O2 (AFR) at full throttle",
            "ok": f"{n(target - 1.0, 1)}–{n(target + 0.5, 1)}",
            "see": f"leaner than {n(at('LIMITS.mixture.leanLimit', 12.0), 1)}",
            "then": "Lift. Upload before the next pull.",
        }
    if key == "boost":
        return {
            "gauge": "Turbo Pressure",
            "ok": f"within +{n(at('LIMITS.overshoot.good', 1.5), 1)} psi of Turbo Pressure Target",
            "see": f"more than +{n(at('LIMITS.overshoot.watch', 2.5), 1)} psi above Turbo Pressure Target, held",
            "then": "Upload. A held overshoot is the only reason to touch boost.",
        }
    if key == "rpm":
        return {
            "gauge": "Engine RPM",
            "ok": "2,000 rpm or more",
            "see": "under 1,700 rpm",
            "then": "Use S or a paddle below 60 km/h.",
        }
    if key == "live":
        names = [channel_name(k) for k in (dead or [])] or ["Turbo Pressure", "DIFP", "Transmission Temperature"]
        return {
            "gauge": join_names(names),
            "ok": "move as you drive",
            "see": "stuck on one number",
            "then": "Remove it from the gauge list, add it back, then start the log again.",
        }
    return None


def gauge_table(
    keys: list[str] | None, limits: Mapping[str, Any], dead: list[str] | None = None
) -> dict[str, Any] | None:
    """The gauge table for a step, or None when the step watches no gauge."""
    rows = [r for r in (gauge_row(k, limits, dead) for k in keys or []) if r]
    if not rows:
        return None
    return {"columns": list(GAUGE_COLUMNS), "rows": rows}


# ---------------------------------------------------------------------------
# The drive recipe: when, how warm, how many pulls, how long
#
# Numbered, short and physical — no jargon the owner has to translate, and no KTuner
# table name anywhere (only the Flash plan names those).
# ---------------------------------------------------------------------------
def log_guide(
    limits: Mapping[str, Any], profile: Mapping[str, Any] | None = None, calibrate: bool = False
) -> dict[str, Any]:
    """The drive brief a shop hands its customer (tuning-shop D4; kc-drive-brief, kc-log-gate).

    Sections in the order the owner drives them, every number from the engine's limits or the
    sourced cards, and the checkpoints the log will be read against (the same ones
    `log_checkpoints` scores after the upload). `calibrate`: the Calibration drive's brief
    (calibration drive C6), the same drive with the parked asks first and the pulls floored on slot 2.
    """
    guide = _baseline_guide(limits, profile)
    return _calibration_guide(guide, profile) if calibrate else guide


#: The trial slot the Calibration drive's floored pulls run on (kc-drive-brief tune-two; kc-calibration-drive).
CALIBRATION_SLOT = 2


def _calibration_guide(guide: dict[str, Any], profile: Mapping[str, Any] | None) -> dict[str, Any]:
    """The Baseline brief with C6's three changes: parked asks first, floored pulls on slot 2, two more checkpoints."""
    profile = profile or {}
    gates = load_thresholds()["boost_step_gates"]["value"]
    full = profile.get(P.PEDAL_FULL)
    parked = [
        f"Your Pedal full reading is on file: {num_words(full)} %." if full is not None else
        "Ignition on, engine off (press Start twice without the brake), TunerView's live screen open: press the pedal "
        "to the floor and hold it, three times. Read TPS at each hold and type the highest in your car profile as the "
        "Pedal full reading.",
    ]
    unchecked = [label for field, (_, label) in P.LOGGER_CHANNELS.items() if profile.get(field) is None]
    if unchecked:
        parked.append(f"In TunerView's gauge list, check whether it offers {join_names(unchecked)}, and say so in "
                      "your car profile's Logger setup.")
    if profile.get(P.LOGGER_RATE) is None:
        parked.append("Open TunerView's logging rate menu and type its fastest logging rate in the Logger setup too.")
    parked.append("If you can, attach a screenshot of KTuner's Quick Adjustments screen here, so I can see the map's settings.")
    hold, rpm = num_words(gates["hold_s"]), f"{gates['rpm_min']:,}"
    slot = f"{CALIBRATION_SLOT} (Tune {CALIBRATION_SLOT})"
    sections = [{"title": "Parked, the evening before", "steps": parked}]
    for section in guide["sections"]:
        if section["title"] == "The two pulls":
            section = {**section, "steps": [
                f"Choose slot {slot} when you start the car: while you choose, the tach shows 2,000 rpm for it. Turn ECO off.",
                "Put the gearbox in S.",
                f"From a steady 50 km/h, press the pedal to the floor, all the way, and hold it until 100 km/h: "
                f"at least 5 seconds, above {rpm} rpm for {hold} s or more.",
                *section["steps"][2:],
                "No brake launch, and no pull with the CVT fluid at 90 °C or more.",
            ]}
        sections.append(section)
    return {
        **guide,
        "title": "The Calibration drive",
        "intro": (
            "One drive answers whether more boost can show on your car: it reads whether the boost target reaches "
            "your map's table with the pedal floored. It adds no power by itself, and it can come back \"capped\": "
            "that is an answer too. About 25 minutes, done once."
        ),
        "sections": sections,
        "checkpoints": [*guide["checkpoints"], f"2 floored pulls held {hold} s or more above {rpm} rpm", f"On slot {slot}"],
        "slot": CALIBRATION_SLOT,
    }


def _baseline_guide(limits: Mapping[str, Any], profile: Mapping[str, Any] | None) -> dict[str, Any]:
    cool = n(lim(limits, "CAR_RULES.coolIat", 42), 0)
    pull_iat = n(lim(limits, "DRIVE_LIMITS.pullIatGood", 48), 0)
    # The Logger census (calibration drive C4, C5): never ask for what TunerView can't log.
    rate = num_words(rate_bar(profile))
    asked = [label for _, label in P.LOGGER_CHANNELS.values() if label not in not_offered_names(profile)]
    gauges = "Turn on every gauge in the table below" + (
        f", plus {join_names(asked)} if your app offers them." if asked else ".")
    sections = [
        {"title": "Before you drive, in TunerView", "steps": [
            gauges,
            f"Set the logging rate as fast as it goes: {rate} samples a second or more.",
            "Mount the phone where you won't touch it, and start the log before you set off.",
        ]},
        {"title": "When and where", "steps": [
            f"Before 8 am, or after an hour parked in shade, so the intake reads under {cool} °C.",
            "Pick a straight, empty road where full throttle is legal and safe. Never in traffic.",
        ]},
        {"title": "Warm up, then cruise", "steps": [
            f"Drive about 10 minutes normally, until coolant reads {BRIEF_WARM_ECT} °C or more.",
            "Then cruise steady at a few different speeds, light throttle, several minutes in all: your fuel trims are read from this.",
        ]},
        {"title": "The two pulls", "steps": [
            "Put the gearbox in S.",
            "From a steady 50 km/h, press the pedal all the way down and hold it until 100 km/h, then lift.",
            f"Cruise calmly about a minute so the intake cools, check it reads under {pull_iat} °C, then do the second pull the same way.",
        ]},
        {"title": "Finish", "steps": [
            f"Keep at least {BRIEF_MOVING_S // 60} minutes of moving time in the log in all.",
            "Idle a minute, stop the log, export it as CSV, and attach it here.",
        ]},
    ]
    checkpoints = [
        f"Logged {rate} times a second or faster",
        f"{BRIEF_MOVING_S // 60} minutes or more of moving",
        "Every gauge moving",
        *([f"{join_names(asked)} in the log"] if asked else []),
        f"Engine warm (coolant {BRIEF_WARM_ECT} °C or more)",
        f"Cool intake while moving (under {cool} °C)",
        "2 full-throttle pulls",
        f"Pulls started under {pull_iat} °C intake",
    ]
    return {
        "title": "One Cool drive with 2 pulls",
        "intro": (
            "This is the drive a tuner asks for first: everything later is compared with it, so it has to be cool, warm-engined "
            "and repeatable. About 20 minutes."
        ),
        "sections": sections,
        "checkpoints": checkpoints,
        "recipe": drive_recipe("baseline", limits, channels_open=bool(asked)),
        "gauges": gauge_table(["iat", "kc", "afr", "trims"], limits),
        "slot": None,
    }


#: The drive brief's own bars (kc-log-gate, kc-drive-brief; drive-check-tuner-analysis.md §4 Gate 0).
BRIEF_RATE_HZ = 10
BRIEF_MOVING_S = 600
BRIEF_WARM_ECT = 80
#: The slowest log a Boost step proof can read (thresholds.json boost_step_gates.rate_min_hz).
RATE_MIN_HZ = load_thresholds()["boost_step_gates"]["value"]["rate_min_hz"]


def rate_bar(profile: Mapping[str, Any] | None) -> float:
    """The logging-rate bar (calibration drive C5): TunerView's stated fastest rate, from 6 to 10 a second."""
    stated = (profile or {}).get(P.LOGGER_RATE)
    return BRIEF_RATE_HZ if stated is None else max(RATE_MIN_HZ, min(BRIEF_RATE_HZ, stated))


def not_offered_names(profile: Mapping[str, Any] | None) -> list[str]:
    """The channels the owner says TunerView doesn't offer on this car, by name."""
    return [label for field, (_, label) in P.LOGGER_CHANNELS.items() if (profile or {}).get(field) is False]


def num_words(value: float) -> str:
    """7.5 or 10: a rate as the owner reads it."""
    return n(value, 0 if float(value).is_integer() else 1)


#: What each Ceiling read means for the map (calibration drive C7, C10): the reason, and what unlocks it.
CEILING_MEANS = {
    "none": "No map change yet: drive the Calibration drive on a cool morning.",
    "no-reading": "No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive.",
    "pedal-wrong": "No map change yet: read the pedal again, parked, then drive the Calibration drive.",
    "slow-log": "No map change yet: set TunerView's logging rate faster, then drive the Calibration drive again.",
    "not-floored": "No map change yet: drive it again with the pedal all the way to the floor.",
    "cut": "No map change yet: drive it again on the same road when it's dry, or on a different road.",
    "throttle": "No map change: a protection is closing the throttle, so a raised boost cell would never show.",
    "turbo": "No map change: this turbo has no more boost to give with the wastegate shut.",
    "ramping": "No map change yet: hold each pull longer, where that's legal and safe.",
    "capped": "No map change: the map caps the target before the table, so a raised cell would never show in the log.",
    "reaches": "Boost step: the gates are next.",
}
CEILING_UNLOCKS = {
    "capped": "A different basemap (a new Map version from a KTuner basemap or a vendor file), then a new Calibration drive.",
}


def calibration_card(
    cal: Mapping[str, Any], summary: Mapping[str, Any] | None, profile: Mapping[str, Any] | None, rate: float | None
) -> dict[str, Any]:
    """The Calibration result card (calibration drive C10): Pedal, Logger, Ceiling, What it means.

    Every number is the engine's: the Ceiling read `cal`, this Drive's summary (its pedal numbers) and
    log rate, and the owner's Logger census. `meaning` and `unlocks` are what the map tour's boost row quotes.
    """
    s, profile, status = summary or {}, profile or {}, cal.get("status") or "none"
    gates = load_thresholds()["boost_step_gates"]["value"]
    throttle_open = load_thresholds()["ceiling_read"]["value"]["throttle_open_pct"]
    full, floored = s.get("pedalFullPct"), s.get("flooredPct")
    pedal = (f"Full reads {num_words(full)} %, floored from {num_words(floored)} %" if full is not None
             else "Not set yet: type the Pedal full reading in your car profile")
    offered = {True: "offered", False: "not offered", None: "not checked"}
    logger = " · ".join([
        f"{num_words(rate)} a second" if rate is not None else "rate unknown",
        *(f"{label} {offered[profile.get(field)]}" for field, (_, label) in P.LOGGER_CHANNELS.items()),
    ])
    psi = lambda v: n(v, 1)  # noqa: E731
    at_cell = (f"target {psi(cal.get('target'))} psi against the table's {psi(cal.get('cell'))} psi at "
               f"{cal.get('rpm') or 0:,} rpm · TPS Command {n(cal.get('cmd'))} % · EWG {num_words(round(cal.get('ewg') or 0, 1))} %")
    ceiling = {
        "none": "Can't tell yet: no Cool drive read since the ceiling last moved.",
        "not-floored": f"Can't tell: no pull held the pedal at {num_words(cal.get('floored') or 0)} % or more for "
                       f"{num_words(gates['hold_s'])} s above {gates['rpm_min']:,} rpm.",
        "cut": "Can't tell: every floored pull was cut short by VSA.",
        "throttle": f"Throttle held back: TPS Command held at {n(cal.get('cmd'))} % with the pedal floored, under {throttle_open} %.",
        "turbo": f"Turbo at its limit: {psi(cal.get('under'))} psi under target with the wastegate shut "
                 f"(EWG {num_words(round(cal.get('ewg') or 0, 1))} %).",
        "ramping": f"Still ramping: the target still rose {psi(cal.get('rise'))} psi in the pull's last second.",
        "capped": "Capped below the table: " + at_cell,
        "reaches": "Reaches the table: " + at_cell,
    }.get(status) or f"Can't tell: the drive {cal.get('text') or 'could not be read'}."
    meaning, unlocks = CEILING_MEANS.get(status, CEILING_MEANS["none"]), CEILING_UNLOCKS.get(status)
    decisive = status in ("throttle", "turbo", "capped")
    return {
        "status": status,
        "settled": bool(cal.get("settled")),
        "mapAction": cal.get("mapAction") or "no-change",
        "meaning": meaning,
        "unlocks": unlocks,
        "lines": [
            {"label": "Pedal", "value": pedal, "tone": "good" if full is not None and status != "pedal-wrong" else "watch"},
            {"label": "Logger", "value": logger, "tone": "watch" if rate is not None and rate < RATE_MIN_HZ else "good"},
            {"label": "Ceiling", "value": ceiling, "tone": "good" if status == "reaches" else "watch" if decisive else "none"},
            {"label": "What it means", "value": f"{meaning} {unlocks}" if unlocks else meaning,
             "tone": "good" if status == "reaches" else "watch" if decisive else "none"},
        ],
    }


def calibration_step(cal: Mapping[str, Any] | None, profile: Mapping[str, Any] | None) -> dict[str, Any]:
    """The Next step while the Calibration drive is unsettled (stage `calibrate`): what is missing first, then the drive.

    One Next step, always: the Calibration card in the same reply asks for the same drive. Same shape as
    `next_step_card`, kind `drive`, settled by the Calibration drive's upload.
    """
    profile, status = profile or {}, (cal or {}).get("status") or "none"
    unchecked = [label for field, (_, label) in P.LOGGER_CHANNELS.items() if profile.get(field) is None]
    logger = [f"say whether TunerView offers {join_names(unchecked)}"] if unchecked else []
    if profile.get(P.LOGGER_RATE) is None:
        logger.append("type TunerView's fastest logging rate")
    first = [
        *(["Type the Pedal full reading in your car profile."] if profile.get(P.PEDAL_FULL) is None else []),
        *([f"In your car profile's Logger setup, {', and '.join(logger)}."] if logger else []),
    ]
    drive = (f"drive the Calibration drive on slot {CALIBRATION_SLOT} (Tune {CALIBRATION_SLOT}): it answers "
             "whether more boost can show on your car.")
    body = f"First: {' '.join(first)} Then {drive}" if first else drive[0].upper() + drive[1:]
    # A read that came back Can't tell for a reason says how to drive it differently this time.
    if status not in ("none", "no-reading") and status in CEILING_MEANS:
        body += " " + CEILING_MEANS[status]
    upload = "your Calibration drive, driven to its brief"
    return {
        "kind": "drive",
        "key": "calibration",
        "title": "The Calibration drive: can more boost show on your car?",
        "body": body,
        "recipe": None,
        "gauges": None,
        "same": False,
        "proves": "whether a raised boost cell can show in your log (the Ceiling read)",
        "upload": upload,
        "uploadWhen": f"Upload when: {upload}.",
        "flashPlan": None,
        "also": None,
    }


def log_checkpoints(
    quality: Mapping[str, Any] | None,
    heat: Mapping[str, Any] | None,
    summary: Mapping[str, Any] | None,
    limits: Mapping[str, Any],
    profile: Mapping[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Did this log meet the drive brief? One row per checkpoint: label, what the log shows, met or not.

    `met` is True / False, or None when the log can't say (no pulls to time, a gauge not logged).
    Every number is the engine's (insight `quality` and `heat`, the Drive summary).
    """
    q = (quality or {}).get("quality") or {}
    h = (heat or {}).get("heat") or {}
    s = summary or {}
    rate = (quality or {}).get("samples_per_second")
    moving = q.get("movingSeconds")
    missing = [channel_name(k) for k in q.get("missing") or []]
    # Calibration drive C5: what TunerView doesn't offer on this car can't be asked for.
    not_offered = [channel_name(k) for k in q.get("notOffered") or []]
    bar = rate_bar(profile)
    flat = [channel_name(k) for k in q.get("flat") or []]
    cool_iat = lim(limits, "CAR_RULES.coolIat", 42)
    pull_iat_max = lim(limits, "DRIVE_LIMITS.pullIatGood", 48)
    pulls = s.get("hardPulls")
    ect, iat_moving, pull_iat = h.get("ectMax"), h.get("iatMoving"), h.get("pullIat")

    def row(cid: str, label: str, value: str, met: bool | None) -> dict[str, Any]:
        return {"id": cid, "label": label, "value": value, "met": met}

    return [
        row("rate", f"Logged {num_words(bar)} times a second or faster",
            f"{n(rate, 1)} a second" if rate is not None else "unknown", None if rate is None else rate >= bar),
        row("moving", f"{BRIEF_MOVING_S // 60} minutes or more of moving",
            f"{n(moving / 60 if moving is not None else None, 0)} min", None if moving is None else moving >= BRIEF_MOVING_S),
        row("gauges", "Every gauge moving", "all moving" if not flat else "stuck: " + join_names(flat), not flat),
        row("channels", "AFR Command and MAF Hz in the log",
            "missing: " + join_names(missing) if missing
            else f"can't say: TunerView doesn't offer {join_names(not_offered)} on this car" if not_offered
            else "both logged",
            False if missing else None if not_offered else True),
        row("warm", f"Engine warm (coolant {BRIEF_WARM_ECT} °C or more)",
            f"{n(ect)} °C peak" if ect is not None else "not logged", None if ect is None else ect >= BRIEF_WARM_ECT),
        row("cool", f"Cool intake while moving (under {n(cool_iat)} °C)",
            f"{n(iat_moving)} °C" if iat_moving is not None else "not logged",
            None if iat_moving is None else iat_moving < cool_iat),
        row("pulls", "2 full-throttle pulls", f"{pulls if pulls is not None else 0} hard pulls",
            None if pulls is None else pulls >= 2),
        row("pullIat", f"Pulls started under {n(pull_iat_max)} °C intake",
            f"{n(pull_iat)} °C" if pull_iat is not None else "no pull to time",
            None if pull_iat is None or not pulls else pull_iat <= pull_iat_max),
    ]


#: KTuner logs knock retard in 0.5° steps (ktuner-only-tuning.md §1): a smaller gap between fuels is noise.
FUEL_SAME_DEG = 0.5


def fuel_test_line(test: Mapping[str, Any] | None) -> str:
    """The premium-fuel verdict in one sentence, from the engine's matched pairs (kc-fuel-test)."""
    test = test or {}
    if test.get("status") != "measured" or not test.get("pairs"):
        return "Can't tell yet: " + str(test.get("why") or "no matched drives on two fuels.")
    pairs = test["pairs"]
    p = pairs[0]
    ta, tb = p.get("timingA"), p.get("timingB")
    count = plural(len(pairs), "matched pair", "matched pairs")
    peaks = f"Knock Control peak {n(p['kcPeakA'], 2)} on {p['fuelA']} vs {n(p['kcPeakB'], 2)} on {p['fuelB']}"
    if ta is None or tb is None:
        return f"{peaks}, on {count} within {n(test.get('iatMatch'))} °C intake."
    if abs(ta - tb) <= FUEL_SAME_DEG:
        return (
            f"No measurable difference yet: {peaks} ({n(ta, 1)}° vs {n(tb, 1)}° of timing pulled), inside KTuner's "
            f"{FUEL_SAME_DEG}° logging step, on {count} within {n(test.get('iatMatch'))} °C intake."
        )
    better = p["fuelA"] if ta < tb else p["fuelB"]
    return (
        f"{better} kept more timing: {peaks} ({n(ta, 1)}° vs {n(tb, 1)}° of timing pulled), on {count} within "
        f"{n(test.get('iatMatch'))} °C intake."
    )


#: Health report bands, only where a knowledge card cites the limits (research §2): per check id, the card,
#: the unit, the decimals the row's words show, and the scale. Knock Control, trims and CVT marks are the
#: engine's own limits (the ones its Verdict word grades against), each checked equal to the card's number;
#: thresholds.json's boost_step_gates agree (kc_max 0.56, trim_max_pct 5). Intake air is graded against
#: engine-only limits (50/60) that no card backs, so its two brief lines (cool 42, pull start 48) are drawn
#: as reference lines that start no zone. Coolant has no band.
HEALTH_BANDS: dict[str, dict[str, Any]] = {
    "kControl": {"source": "kc-ranges", "unit": "", "decimals": 2, "min": 0.45, "max": 0.85},
    "trims": {"source": "kc-trims", "unit": "%", "decimals": 1, "min": -15, "max": 15},
    "cvtTemp": {"source": "kc-cvt", "unit": "°C", "decimals": 0, "min": 30, "max": 110},
    "iat": {"source": "kc-drive-brief", "unit": "°C", "decimals": 0, "min": 20, "max": 60},
}


def _band_marks(check_id: str, limits: Mapping[str, Any]) -> list[tuple[float, str, str]] | None:
    """`(at, word, tone)` per mark, or None when a limit is missing (no band beats a made-up one)."""
    get = lambda path: lim(limits, path, None)  # noqa: E731
    if check_id == "kControl":  # kc-ranges kc-floor, kc-watch, kc-nohard, kc-stop
        marks = [(get("LIMITS.score.baseline"), "Floor", "good"), (get("LIMITS.score.watch"), "Watch", "watch"),
                 (get("LIMITS.score.noHard"), "No hard driving", "watch"), (get("LIMITS.score.stop"), "Stop", "stop")]
    elif check_id == "trims":  # kc-trims trim-ok (OK within it), trim-stop: a symmetric scale
        ok, stop = get("LIMITS.trim.good"), get("LIMITS.trim.watch")
        marks = [] if ok is None or stop is None else [
            (-stop, "Stop", "stop"), (-ok, "Watch", "watch"), (ok, "Watch", "watch"), (stop, "Stop", "stop")]
    elif check_id == "cvtTemp":  # kc-cvt cvt-fluid-watch, cvt-fluid-stop
        marks = [(get("LIMITS.cvt.good"), "Watch", "watch"), (get("LIMITS.cvt.watch"), "Stop", "stop")]
    elif check_id == "iat":  # kc-drive-brief brief-cool-iat, brief-pull-iat: reference lines only
        marks = [(get("CAR_RULES.coolIat"), "Cool", "none"), (get("DRIVE_LIMITS.pullIatGood"), "Pull start", "none")]
    else:
        return None
    return marks if marks and all(isinstance(at, (int, float)) for at, _, _ in marks) else None


def health_band(check_id: Any, value: Any, limits: Mapping[str, Any] | None) -> dict[str, Any] | None:
    """The bullet bar for one check: its own number (as the row shows it) on the card's scale, else None."""
    spec = HEALTH_BANDS.get(str(check_id))
    marks = _band_marks(str(check_id), limits or {}) if spec else None
    if not marks or not isinstance(value, (int, float)) or isinstance(value, bool):
        return None
    places = spec["decimals"]
    # Half away from zero, as the engine's toFixed words the row (Python's round() goes to even).
    q = Decimal(str(abs(value))).quantize(Decimal(1).scaleb(-places), ROUND_HALF_UP)
    shown = math.copysign(float(q), value) if places else int(math.copysign(int(q), value))
    low, high = spec["min"], spec["max"]
    if low == -high:  # a symmetric scale stays symmetric
        high = max(high, abs(shown))
        low = -high
    def word(at: float) -> str:
        text = str(int(at)) if float(at).is_integer() else n(at, places)
        return "+" + text if spec["min"] < 0 < at else text
    return {
        "value": shown, "unit": spec["unit"], "min": min(low, shown), "max": max(high, shown),
        "marks": [{"at": at, "label": f"{label} {word(at)}", "tone": tone} for at, label, tone in marks],
        "source": spec["source"],
    }


def health_rows(
    overview: Mapping[str, Any] | None, facts: Mapping[str, Any] | None = None, limits: Mapping[str, Any] | None = None
) -> dict[str, Any] | None:
    """The engine's health checks as the report shows them: system, check, value, verdict word.

    `facts` is the engine's `driveFacts`: each check's own number (`check.<id>.value`) puts it on its
    cited band, marked with the engine's `limits`. A check with no number, or one that reads Can't tell
    (a flat or missing channel), gets no band.
    """
    if not overview or not overview.get("checks"):
        return None
    facts = facts or {}
    gates = {"fuel": "Fuel", "air": "Air & boost", "spark": "Spark", "heat": "Heat", "cvt": "CVT"}
    tones = {"good": "good", "watch": "watch", "stop": "stop", "nodata": "none"}
    rows = []
    for check in overview["checks"]:
        status = str(check.get("status"))
        word, tone = VERDICT_WORDS.get(status, VERDICT_WORDS["nodata"]), tones.get(status, "none")
        rows.append(
            {"system": gates.get(str(check.get("gate")), str(check.get("gate") or "")), "id": check.get("id"),
             "label": check.get("label"), "value": check.get("value"), "word": word, "tone": tone,
             "band": None if status == "nodata" else health_band(check.get("id"), facts.get(f"check.{check.get('id')}.value"), limits)}
        )
    return {"line": overview.get("verdict_text"), "rows": rows}


def drive_recipe(
    key: str, limits: Mapping[str, Any], channels_open: bool = False, drive: Mapping[str, Any] | None = None
) -> dict[str, Any] | None:
    """`{intro, steps}` for the Drive a step asks for, or None when it asks for none."""
    def at(path: str, fallback: Any) -> Any:
        return lim(limits, path, fallback)

    if key == "baseline":
        steps = [
            f"Before 8 am, or after an hour parked in shade: intake under {n(at('CAR_RULES.coolIat', 42), 0)} °C.",
            "10 minutes of normal driving first, so the engine and the CVT are warm.",
            "Then two pulls in S, 50 → 100 km/h, on a straight safe road, a minute apart.",
        ]
        if channels_open:
            steps.append(
                "While you are in TunerView: add AFR Command and MAF Hz to the logged list if your app "
                f"offers them. Without AFR Command I judge the mixture against the map's "
                f"{n(at('LIMITS.mixture.target', 11.0), 1)}, not what the ECU asked for."
            )
        return {
            "intro": (
                "Every “did it work?” needs a Drive to compare against. Heat moves boost, timing and the "
                "50→70 time on its own, so the Baseline has to be a Cool Drive."
            ),
            "steps": steps,
        }
    if key == "habit":
        return {
            "intro": "",
            "steps": [
                "Below 60 km/h, put it in S (or tap a paddle) before you press past a third of the pedal.",
                "No pulls out of traffic or out of a car park: steady speed for 1–2 minutes first.",
                "Log your next hot-afternoon Drive, same kind of traffic.",
            ],
        }
    if key == "logger":
        dead = [channel_name(k) for k in ((drive or {}).get("summary") or {}).get("flat") or []]
        return {
            "intro": (
                f"{join_names(dead)} sat on one number the whole Drive while the revs moved. The car is "
                "fine; the log isn't. Without boost in the log I cannot check the next pull, and the habit "
                "test cannot be scored."
            ),
            "steps": [
                "Open TunerView before you drive, and check the gauges below move when you blip the throttle.",
                "If one is stuck: remove it from the gauge list, add it back, restart logging.",
            ],
        }
    if key == "install":
        return {
            "intro": "No map change: this is a physical check, not a flash.",
            "steps": [
                "With the engine cold, check every clamp between the sensor and the engine is tight.",
                "A lean reading under boost is a real lean (fuel pressure or the airflow sensor): a downpipe flange "
                "leak never reads lean on the front A/F, it shows on the rear O2 / P0420.",
                "Log your next drive, any kind, with the same gauges.",
            ],
        }
    return None


# ---------------------------------------------------------------------------
# Owner questions: what only the owner knows, as tap-to-answer choices
#
# Generated by the engine (`KTA.carQuestions`), never the model. One question
# at a time, most decisive first; unanswered ones sit beside the thread as
# "Waiting for you". Answers are plain owner words with tap choices, editable:
# answering again overwrites and the Car history re-derives.
# ---------------------------------------------------------------------------
def question_cards(
    questions: list[dict[str, Any]] | None,
    saved: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """The questions as the chat draws them, with the saved answer each holds."""
    cards = []
    for q in questions or []:
        if not isinstance(q, dict) or not q.get("kind") or not q.get("askedOn"):
            continue
        saved_choice = None
        if isinstance(saved, dict):
            entry = saved.get(q.get("id"))
            if isinstance(entry, dict):
                saved_choice = entry.get("choice")
            elif isinstance(entry, str):
                saved_choice = entry
        cards.append(
            {
                "id": q.get("id"),
                "kind": q.get("kind"),
                "title": q.get("title") or "",
                "question": q.get("question") or "",
                "choices": [
                    {"id": c.get("id"), "label": c.get("label") or ""}
                    for c in (q.get("choices") or [])
                    if isinstance(c, dict) and c.get("id")
                ],
                "askedOn": q.get("askedOn"),
                "answer": saved_choice,
            }
        )
    return cards


def waiting_for_you(
    questions: list[dict[str, Any]] | None,
    saved: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Unanswered questions as the Open steps panel lists them."""
    out = []
    for q in questions or []:
        if not isinstance(q, dict) or not q.get("id"):
            continue
        if saved and q["id"] in saved:
            continue
        out.append(
            {
                "id": q["id"],
                "title": str(q.get("title") or q.get("question") or "A question"),
                "askedOn": q.get("askedOn"),
            }
        )
    return out


# ---------------------------------------------------------------------------
# The MAF Scaling option for one housing, inside the KTuner box
#
# The housing answer only resolves the Flash plan's own preset route: factory
# airbox → Factory; PRL HVI → Factory, proven by the next calm drive's trims;
# PRL Race → PRL Race; 27WON Race → 27Won Race; not sure → stay on the Undo
# file with no MAF Scaling option suggested.
# ---------------------------------------------------------------------------
def housing_line(housing: str | None) -> dict[str, Any] | None:
    """`{option, detail}` for the KTuner box, or None when nothing is answered."""
    if not housing:
        return None
    table = {
        "factory": ("Factory", "Factory airbox, factory housing."),
        "hvi": (
            "Factory",
            "PRL says the HVI gives proper trims with no tune. Not assumed: "
            "the next calm drive must show trims within ±5 %.",
        ),
        "race": ("PRL Race", "The PRL Race housing is larger than factory; its curve is in your file."),
        "won": ("27Won Race", "The 27WON Race housing has its own curve in your file."),
        "unsure": (
            None,
            "Stay on the Undo file. Check the housing (receipt, or the label on it) "
            "before changing MAF Scaling.",
        ),
    }
    hit = table.get(housing)
    if hit is None:
        return None
    option, detail = hit
    return {"housing": housing, "option": option, "detail": detail}


# ---------------------------------------------------------------------------
# The diagnosed cause: one plain-words sentence with its evidence
#
# Diagnose (`KTA.carDiagnose`) runs in the engine before the Next step decision;
# this only says its sentence. A drive with no diagnosed cause carries None,
# and the chat draws nothing.
# ---------------------------------------------------------------------------
def cause_line(diagnose: Mapping[str, Any] | None) -> str | None:
    """The one cause in one sentence, or None when nothing was diagnosed."""
    if not isinstance(diagnose, Mapping):
        return None
    sentence = (diagnose.get("sentence") or "").strip()
    return sentence or None


# ---------------------------------------------------------------------------
# The one Next step
#
# The engine decides it (`KTA.carNextStep`: the fixed order — open Stop, Too-short
# Drive, logger fault, no Baseline yet, a cause seen today, an Open step still
# open, otherwise nothing). This module only says it: the title the engine chose,
# the drive recipe or the gauge table it asked for, and the Drive whose upload will
# settle it. A repeated step is one short line, never a second essay.
# ---------------------------------------------------------------------------
def backfill_step(drive_id: str, newest_id: str) -> dict[str, Any]:
    """An older log uploaded after newer ones: history only, the current steps stand (tuning-shop D7)."""
    mine, newest = drive_stamp(drive_id), drive_stamp(newest_id)
    return {
        "kind": "none",
        "key": "backfill",
        "title": "Added to your history",
        "body": (
            f"This log is from {mine}, older than your latest ({newest}). It joins your Car history and "
            "your Baseline, and leaves your current steps exactly as they are: only a newer drive can settle them."
        ),
        "recipe": None,
        "gauges": None,
        "same": False,
        "proves": "nothing",
        "upload": "your next drive, as your current steps ask",
        "uploadWhen": "your next drive, as your current steps ask",
        "flashPlan": None,
        "also": None,
    }


def repeat_note(at: int | None) -> dict[str, Any]:
    """A re-upload of a Drive already in the Car history, said in one line at the top (R2-9)."""
    when = f", on {stamp_day(at)}" if at is not None else ""
    return {"line": f"I read this drive before{when}: nothing new is added to your car file.", "at": at}


def next_step_card(
    step: Mapping[str, Any] | None,
    plan: Mapping[str, Any] | None = None,
    limits: Mapping[str, Any] | None = None,
    open_steps: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """The typed Next step the chat renders. Never a list: one step, always."""
    if not step:
        return None
    limits = limits or {}
    key = str(step.get("key") or "")
    kind = str(step.get("kind") or "none")
    # A repeated *step* is one short line. A Too-short Drive says same = true too,
    # but it opens nothing, so its line is the whole reply: the owner has to be
    # told what was not read and which step still stands.
    compact = bool(step.get("same")) and step.get("opens") is not None
    dead = list(step.get("flat") or [])
    channels_open = any(s.get("key") == "channels" and s.get("status") != "done" for s in open_steps or [])
    upload = (step.get("settlesOn") or "").strip()
    headline = (plan or {}).get("headline") or ""

    body = ""
    recipe = None
    gauges = None
    flash_plan = None

    if kind == "flash":
        # A Flash Next step's cells come only from the Flash plan (ticket 13 draws
        # the card): the plan's own headline, the Map version to flash back to for
        # an Undo (or the save-as name for a forward change), and the Shakedown
        # drive that proves it.
        if key == "undo" or (plan or {}).get("kind") == "undo":
            # One sentence why (the diagnosed cause, as the install step says it), then the steps.
            body = cause_line(step.get("diagnose")) or (
                "Today's log is worse than the map before it: put that map back first."
            )
            recipe = undo_recipe(plan)
        elif (plan or {}).get("kind") == "blocked":
            # Both map checks (ADR 0003) must pass before a cell reaches the owner:
            # a refused change says why and offers nothing to type.
            body = headline
        else:
            # The cells are the KTuner card's (flash.py): this is the one-line brief.
            save_as = (plan or {}).get("saveAs")
            body = headline + (f" Save as {save_as}." if save_as else "")
            body += " Then drive a Shakedown drive: 10 calm minutes, no hard driving."
        flash_plan = plan or None
    elif key == "tooShort":
        body = "Under a minute moving. I keep your Car history clean and I don't judge it."
        previous = step.get("previous")
        if previous:
            body += f" The step you already have stands: {previous.get('title')}."
        if upload:
            body += f" Upload {upload}."
    elif key == "none":
        body = (
            "Most Drives end here, and that is an answer, not a gap: nothing in your logs calls for a map "
            "change. Nothing to type in KTuner."
        )
        flash_plan = plan or None
    else:
        cause = step.get("cause") or {}
        if key == "habit":
            body = (
                cause.get("why")
                or "The Baseline is in. Keep the habit going: the next hot afternoon scores it."
            )
        if key == "install":
            diagnose = step.get("diagnose") or {}
            body = (diagnose.get("sentence") or "").strip() or (
                "No map change: this is a physical check, not a flash."
            )
        recipe = drive_recipe(key, limits, channels_open, {"summary": {"flat": dead}})
        gauges = gauge_table(step.get("gauges"), limits, dead)
        # The recipe's opening line is the step's body; its numbered steps are
        # what the owner does about it.
        if recipe and not body:
            body = recipe.get("intro") or ""

    card = {
        "kind": kind,
        "key": key,
        "title": step.get("title") or "",
        "body": "" if compact else body,
        "recipe": None if compact else recipe,
        "gauges": None if compact else gauges,
        "same": compact,
        "proves": step.get("proves") or "",
        "upload": upload,
        "uploadWhen": f"Upload when: {upload}." if upload else "",
        "flashPlan": flash_plan,
        "also": None,
    }
    # A cause seen today, told as a free habit beside the step it was seen on.
    also_key = step.get("also")
    if also_key:
        card["also"] = {
            "key": also_key,
            "title": "Also seen today: keep the revs up (free, no Flash)",
            "why": (step.get("cause") or {}).get("why") or "",
            "steps": (drive_recipe("habit", limits, channels_open) or {}).get("steps") or [],
            "settlesOn": "after your next hot-afternoon Drive",
        }
    return card

# ---------------------------------------------------------------------------
# The whole reply, as typed state the chat renders (never as prose to parse)
# ---------------------------------------------------------------------------
def build_reply(
    drive: Mapping[str, Any],
    plan: Mapping[str, Any] | None,
    limits: Mapping[str, Any],
    drives_read: list[str],
    harness: Mapping[str, Any] | None = None,
    first_drive: bool = False,
    window: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """The reply in the order the owner reads it.

    One Next step, always — Decide fills `settled`, `wasted` and `nextStep` from
    the engine (`KTA.carSettle`, `KTA.carNextStep`) once it has settled this Drive
    against every Open step. They are declared here, empty, so the order the owner
    reads them in is written down in one place: the sentence that answers "am I
    hurting it?", the window, the four numbers, the Map version, what was asked
    last time, whether this Drive was a Wasted one, the Flash plan, and exactly
    one Next step.

    `window` is the drive window (`window.py`: `{ ids, since }`). A Too-short
    Drive read nothing, so it keeps its one line; every other reply states the
    window it was read against, bounded by the last Flash or Install like for
    like with the Next step Decide reads.
    """
    card = window_card(dict(window) if window is not None else None)
    if drive.get("tooShort") or window is None:
        line = window_line(drives_read, len(drives_read), bool(drive.get("tooShort")))
        card = {**card, "line": line}
    return {
        "say": first_sentence(drive, limits),
        "afterFlash": after_flash_note(drive),
        "window": card["line"],
        "windowDrives": card["driveIds"],
        "windowSince": card["since"],
        "numbers": [] if drive.get("tooShort") else four_numbers(drive),
        "mapVersion": map_version_card(drive, first_drive),
        "verdict": verdict_word(drive),
        "settled": [],
        "wasted": None,
        "flashPlan": None if drive.get("tooShort") else plan,
        "cause": None,
        "nextStep": None,
        "readback": None,
        "questions": [],
        "housing": None,
        "harness": dict(harness) if harness else None,
    }


# The hosted beta's gate (`owners.py`): the first-run notice and its refusals.
NOTICE_TITLE = "Before you start"
NOTICE_PARAGRAPHS = (
    "KTuner Assistant reads your datalogs and suggests map changes. It can be wrong, and it cannot see your engine.",
    "You decide what to flash, and you flash it at your own risk. Keep a copy of your working map before any change. "
    "If anything reads or feels wrong, stop and go back to that map.",
    "This is a beta. Your logs and car details are stored on this server. Other owners cannot see them. "
    "The person running the beta can read them, and will delete them if you ask.",
)
NOTICE_BUTTON = "I understand, open my car"
GATE_TITLE = "KTuner Assistant"
GATE_INVITE = "Open your invite link to reach your car."
GATE_TOO_BIG = "That file is too big: the limit is {mb} MB, and a drive log is usually about 2 MB. Nothing was saved."
GATE_NO_LENGTH = "That upload did not say how big it is. Try again from the chat."
GATE_BAD_LENGTH = "That upload gave a size I can't read. Try again from the chat."


__all__ = [
    "GATE_BAD_LENGTH",
    "GATE_INVITE",
    "GATE_NO_LENGTH",
    "GATE_TITLE",
    "GATE_TOO_BIG",
    "NOTICE_BUTTON",
    "NOTICE_PARAGRAPHS",
    "NOTICE_TITLE",
    "GAUGE_COLUMNS",
    "MAP_VERSION_WHAT_IT_IS",
    "STEP_STATUS_TONE",
    "STEP_STATUS_WORD",
    "VERDICT_WORDS",
    "VERDICT_LEAD",
    "build_reply",
    "calibration_step",
    "cause_line",
    "channel_name",
    "drive_recipe",
    "drive_stamp",
    "first_sentence",
    "after_flash_note",
    "four_numbers",
    "gauge_row",
    "gauge_table",
    "join_names",
    "map_version_card",
    "map_version_line",
    "n",
    "next_step_card",
    "question_cards",
    "housing_line",
    "waiting_for_you",
    "settled_rows",
    "step_words",
    "sg",
    "stamp_day",
    "stamp_of",
    "repeat_note",
    "undo_named",
    "undo_recipe",
    "verdict_word",
    "wasted_line",
    "window_card",
    "window_line",
    "window_line_for",
]