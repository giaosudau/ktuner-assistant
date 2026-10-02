"""The built-in reply: every word the owner reads until the model takes over.

One person, in a car park, on a phone, afraid they have broken something. So:

* **The first sentence answers "am I hurting it?"** with *this* Drive's own
  numbers, in the same sentence. Never a summary, never a list.
* Then, in this order and nothing else: the four numbers as a compact row
  (intake air while moving, Knock Control start → peak, worst fuel trim, hard
  pulls), the **Verdict** word, the **Flash plan** headline, the collapsed
  harness steps, and **exactly one Next step**.
* A **Too-short drive** gets `Nothing read: under a minute moving` and no
  Verdict word, because CONTEXT.md says a Too-short drive gets no verdict.
* Every reply states its window in the owner's words.

Only the words of `CONTEXT.md` are used. KTuner's own spellings are kept:
Starter 21 Dual Tune 2, MAF Scaling, Turbo Pressure, Knock Control, IAT2, DIFP,
Transmission Temperature. No number here is computed — every one arrives from
the worker with the limit it was read against.
"""

from __future__ import annotations

from typing import Any, Mapping

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# The gauge names TunerView spells, for the dead-gauge step (KTuner's channel names).
CHANNEL_NAMES = {
    "boost": "Turbo Pressure",
    "boostTarget": "Turbo Pressure Target",
    "fp": "DIFP",
    "fpTarget": "DIFP Target",
    "cvt": "Transmission Temperature",
    "stft": "STFT B1",
    "ltft": "LTFT B1",
    "kControl": "Knock Control",
    "lam": "O2",
    "lamCmd": "AFR Command",
    "iat": "IAT",
    "iat2": "IAT2",
    "egt": "EGT",
    "map": "MAP",
    "rpm": "Engine RPM",
    "vss": "Vehicle Speed",
}


def channel_name(key: str) -> str:
    return CHANNEL_NAMES.get(key, key)


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
    trim_ok = limits.get("trimOk", 5)
    if trim is not None and abs(trim) > trim_ok:
        clauses.append(f"worst fuel trim {sg(trim, 1)} %")

    leanest = summary.get("mixLeanest")
    if leanest is not None:
        target = summary.get("mixTarget") or limits.get("mapTargetAfr")
        clauses.append(
            f"full-throttle AFR {n(leanest, 1)} (map asks {n(target, 1)}, "
            f"lean limit {n(limits.get('leanLimitAfr'), 1)})"
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


# ---------------------------------------------------------------------------
# The one Next step (spec §"The graph (one upload)" step 4, order from the
# prototype). Ticket 01 is the tracer: the branches that need no Open-step
# settling. Settling Open steps, the Baseline-first order and the habit tests
# are later tickets and slot in here.
# ---------------------------------------------------------------------------
def next_step(drive: Mapping[str, Any], plan: Mapping[str, Any] | None) -> dict[str, Any]:
    """Exactly one Next step: a Flash, a gauge to fix, or nothing."""
    if drive.get("tooShort"):
        return {
            "kind": "none",
            "title": "Nothing new: the step you already have stands",
            "body": "Under a minute moving, so nothing was read and nothing was added to your Car history. "
            "Upload a drive of 10 minutes or more and the step you have now gets checked against it.",
            "proves": "nothing",
            "upload": "your next drive of 10 minutes or more",
        }

    summary = drive.get("summary") or {}
    verdict = str(drive.get("verdict"))

    # 1. An open Stop: Undo is the only step.
    if verdict == "stop":
        headline = (plan or {}).get("headline") or "Flash your previous map file."
        undo = (plan or {}).get("undoName")
        how = (
            f"In KTuner: load {undo} and flash it. Save today's file first so nothing is lost."
            if undo and "not recorded" not in undo
            else "In KTuner: load the file you ran before this drive and flash it. Record your Flashes so I can name it."
        )
        return {
            "kind": "flash",
            "title": "Put the map from before back on the car",
            "body": f"{headline} {how} Then drive a Shakedown drive: 10 calm minutes, no hard driving.",
            "proves": "that the Undo brought the trims back within ±5 %",
            "upload": "the Shakedown drive after the Undo",
            "flashPlan": plan or None,
        }

    # 2. A logger fault: the log, not the car.
    flat = list(summary.get("flat") or [])
    if flat:
        names = ", ".join(channel_name(k) for k in flat)
        return {
            "kind": "watch",
            "title": f"Your logger recorded {len(flat)} dead {plural(len(flat), 'gauge', 'gauges')}",
            "body": f"{names} sat on one number the whole drive while the revs moved. The car is fine; the log isn't. "
            "Remove those gauges in TunerView, add them back, and start the log again.",
            "proves": "that every gauge moves again",
            "upload": "your next drive, any kind",
        }

    # 3. Otherwise: the Flash plan's own headline, and the next Drive to settle it.
    headline = (plan or {}).get("headline") or "Your logs support no map change right now."
    if (plan or {}).get("kind") == "no-change":
        return {
            "kind": "none",
            "title": "Nothing to change. Drive it.",
            "body": "Most drives end here, and that is an answer, not a gap: this turbo has no headroom left.",
            "proves": "that the car is still OK",
            "upload": "after any Flash, any part, a new fuel brand, or Knock Control over 0.60 on the gauge",
            "flashPlan": plan or None,
        }
    return {
        "kind": "flash",
        "title": headline,
        "body": "Change it in KTuner, then drive a Shakedown drive: 10 calm minutes, no hard driving.",
        "proves": "that the change did what the plan said it would",
        "upload": "the Shakedown drive after the change",
        "flashPlan": plan or None,
    }


# ---------------------------------------------------------------------------
# The whole reply, as typed state the chat renders (never as prose to parse)
# ---------------------------------------------------------------------------
def build_reply(
    drive: Mapping[str, Any],
    plan: Mapping[str, Any] | None,
    limits: Mapping[str, Any],
    drives_read: list[str],
    harness: Mapping[str, Any] | None = None,
    next_step: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """The reply in the order the owner reads it.

    One Next step, always — passed in rather than decided here, because Decide
    owns it (spec §"The graph (one upload)", step 4) and a later ticket makes
    that decision fuller. This function is the one place the order is written down.
    """
    return {
        "say": first_sentence(drive, limits),
        "afterFlash": after_flash_note(drive),
        "window": window_line(drives_read, len(drives_read), bool(drive.get("tooShort"))),
        "numbers": [] if drive.get("tooShort") else four_numbers(drive),
        "verdict": verdict_word(drive),
        "flashPlan": None if drive.get("tooShort") else plan,
        "nextStep": dict(next_step) if next_step else None,
        "harness": dict(harness) if harness else None,
    }


__all__ = [
    "VERDICT_WORDS",
    "VERDICT_LEAD",
    "build_reply",
    "channel_name",
    "drive_stamp",
    "first_sentence",
    "after_flash_note",
    "four_numbers",
    "n",
    "next_step",
    "sg",
    "verdict_word",
    "window_line",
]