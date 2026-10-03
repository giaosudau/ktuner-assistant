"""Seam 1: loop eval layer 1 — the owner's nine real Drives (ticket 05).

Eval layer 1 locks the loop's behaviour and measures the win on every run. It
replays the owner's nine real Drives in order — no key, no network, no LLM:
the decisions are the engine's and the words are the built-in ones — and
asserts each Drive's Next step and each Open step status exactly per the
ticket's table, then reports Drives to proof per settled step and the Wasted
drive count. It runs in the default test run and blocks merges: any Next step
or status change fails here.

Ticket table shorthand, as asserted here:
  22 Aug 09:03 → Cool drive with 2 pulls / settles nothing (the first Drive)
  22 Aug 09:50 → same step / Baseline can't tell (hot)
  23 Aug 19:59 → same step / Baseline can't tell (hot)
  23 Aug 20:38 → Flash Undo / Stop verdict (the open Stop)
  30 Aug 15:09 → Too-short, nothing read / settles nothing; the Undo waits
  30 Aug 15:29 → Cool drive with 2 pulls / Undo Done in 2 Drives
  30 Aug 16:01 → Cool drive + habit opened beside / no Done (Baseline waits, hot)
  1 Sep 08:13  → habit test on a hot afternoon / Baseline Done
  5 Sep 07:56  → fix the dead gauges / habit can't tell (cool)

The table omits the channels step (Log AFR Command and MAF Hz), which waits
on every Drive that reads anything — this eval locks those waits too, row by
row, so a channels regression also fails here.

Rule from the ticket: a changed expectation needs the ticket's table updated
in the same change, with a reason.
"""

from __future__ import annotations

import json

from conftest import Loop

# Drive → Next step key/kind/title/still-the-same-step, and what this Drive
# settled as (key, status) pairs in reply order. The titles are the exact
# strings the owner reads; the settled pairs include the channels waits the
# ticket table omits for brevity.
EXPECTED_ROWS = [
    (
        "aug22-0903",
        ("baseline", "drive", "Log one Cool-morning drive with 2 pulls", False),
        [],
        False,
        "Watch",
        "no-change",
    ),
    (
        "aug22-0950",
        ("baseline", "drive", "Log one Cool-morning drive with 2 pulls", True),
        [("channels", "wait"), ("baseline", "wait")],
        True,
        "Watch",
        "no-change",
    ),
    (
        "aug23-1959",
        ("baseline", "drive", "Log one Cool-morning drive with 2 pulls", True),
        [("channels", "wait"), ("baseline", "wait")],
        True,
        "OK",
        "no-change",
    ),
    (
        "aug23-2038",
        ("undo", "flash", "Put the map from before back on the car", False),
        [("channels", "wait"), ("baseline", "wait")],
        False,
        "Stop",
        "undo",
    ),
    (
        "aug30-1509",
        ("tooShort", "none", "Nothing read: the drive was too short", False),
        [],
        True,
        None,
        None,
    ),
    (
        "aug30-1529",
        ("baseline", "drive", "Log one Cool-morning drive with 2 pulls", False),
        [("channels", "wait"), ("baseline", "wait"), ("undo", "done")],
        False,
        "Watch",
        "no-change",
    ),
    (
        "aug30-1601",
        ("baseline", "drive", "Log one Cool-morning drive with 2 pulls", False),
        [("channels", "wait"), ("baseline", "wait")],
        True,
        "Watch",
        "no-change",
    ),
    (
        "sep01-0813",
        ("habit", "drive", "Habit test: log your next hot-afternoon Drive", False),
        [("channels", "wait"), ("baseline", "done"), ("habit", "wait")],
        False,
        "OK",
        "no-change",
    ),
    (
        "sep05-0756",
        ("logger", "watch", "Your logger recorded 4 dead gauges", False),
        [("channels", "wait"), ("habit", "wait")],
        True,
        "OK",
        "no-change",
    ),
]

# Drives to proof, counting uploads after the ask up to and including the
# proof (the engine's own counting: a Too-short upload counts, it just proves
# nothing). Undo: asked 23 Aug 20:38, proven 30 Aug 15:29 → [15:09, 15:29].
# Baseline: asked 22 Aug 09:03, proven 1 Sep 08:13 → the 7 uploads between.
EXPECTED_PROOF_DRIVES = {
    "undo": ["aug30-1509", "aug30-1529"],
    "baseline": [
        "aug22-0950",
        "aug23-1959",
        "aug23-2038",
        "aug30-1509",
        "aug30-1529",
        "aug30-1601",
        "sep01-0813",
    ],
}

# Every Drive that proved nothing: too warm for the Baseline (09:50, 19:59,
# 16:01), too short for the Undo (15:09), dead gauges for the habit (07:56).
EXPECTED_WASTED_IDS = ["aug22-0950", "aug23-1959", "aug30-1509", "aug30-1601", "sep05-0756"]


def replay(loop: Loop):
    """The owner's nine Drives in order, as nine replies."""
    return loop.run(loop.reply_to_all_owner_drives())


def test_loop_eval_locks_the_ticket_table_drive_by_drive(loop: Loop):
    replies = dict(replay(loop))
    got = []
    for example_id, reply in replies.items():
        step = reply.card["nextStep"]
        plan = reply.card["flashPlan"]
        got.append(
            (
                example_id,
                (step["key"], step["kind"], step["title"], step["same"]),
                [(row["key"], row["status"]) for row in reply.card["settled"]],
                reply.card["wasted"] is not None,
                reply.card["verdict"],
                plan["kind"] if plan else None,
            )
        )
    assert [row[0] for row in got] == [row[0] for row in EXPECTED_ROWS], "in order, as driven"
    assert got == EXPECTED_ROWS


def test_loop_eval_ticket_rows_read_as_written(loop: Loop):
    replies = dict(replay(loop))

    # 22 Aug 09:03: the first Drive settles nothing and asks the Baseline.
    assert replies["aug22-0903"].card["settled"] == []

    # 22 Aug 09:50 and 23 Aug 19:59: the same step, Baseline can't tell (hot).
    for example_id in ("aug22-0950", "aug23-1959"):
        card = replies[example_id].card
        assert card["nextStep"]["same"] is True, example_id
        baseline = [r for r in card["settled"] if r["key"] == "baseline"][0]
        assert baseline["status"] == "wait", example_id
        assert "not a Cool Drive" in baseline["why"], baseline["why"]
        assert "too warm" in card["wasted"], card["wasted"]

    # 23 Aug 20:38: the Stop Drive. The open Stop makes Undo the only step,
    # and it is never called a Wasted drive — the owner has a fault to fix.
    stop = replies["aug23-2038"].card
    assert stop["verdict"] == "Stop"
    assert stop["nextStep"]["key"] == "undo"
    assert stop["flashPlan"]["kind"] == "undo"
    assert stop["wasted"] is None

    # 30 Aug 15:09: Too-short, nothing read. It settles nothing at all; the
    # Undo is the step that waits, named by the Wasted line.
    short = replies["aug30-1509"].card
    assert short["verdict"] is None
    assert short["settled"] == []
    assert "too short" in short["wasted"]
    assert "Undo" in short["wasted"]

    # 30 Aug 15:29: the Undo is Done in 2 Drives, with the numbers.
    undone = [r for r in replies["aug30-1529"].card["settled"] if r["key"] == "undo"][0]
    assert undone["status"] == "done"
    assert "Trims −2.3 % over 15 calm minutes" in undone["why"]
    assert "−21.4 %" in undone["why"]
    assert replies["aug30-1529"].card["wasted"] is None, "a Drive that settled something is not wasted"

    # 30 Aug 16:01: Cool drive + the habit opened beside it. No Done anywhere:
    # the Baseline waits (hot), and the habit is opened-beside — never asked
    # for yet — so the reply is a full step, never a compact repeat.
    late = replies["aug30-1601"].card
    assert late["nextStep"]["same"] is False
    assert late["nextStep"]["also"]["key"] == "habit"
    assert [r["status"] for r in late["settled"] if r["key"] == "baseline"] == ["wait"]
    assert "Done" not in {r["word"] for r in late["settled"]}
    decided = {s["name"]: s["output"] for s in replies["aug30-1601"].harness_steps()}["nextStep"]
    habit = [s for s in decided["openSteps"] if s["key"] == "habit"][0]
    assert habit["askedOn"] == replies["aug30-1601"].snapshot()["drive"]["id"]
    assert habit["lastAskedOn"] is None, "opened beside the step, not asked for yet"

    # 1 Sep 08:13: the Drive the Baseline has been waiting for. The habit it
    # asks for is new — opened beside on 16:01, never asked — so not a repeat.
    morning = replies["sep01-0813"].card
    baseline = [r for r in morning["settled"] if r["key"] == "baseline"][0]
    assert baseline["status"] == "done"
    assert "Intake 37 °C, 2 pulls" in baseline["why"]
    assert morning["nextStep"]["key"] == "habit"
    assert morning["nextStep"]["same"] is False

    # 5 Sep 07:56: dead gauges. The habit can't tell (cool), and the Wasted
    # line names the gauges and the hot-afternoon Drive that would count.
    dead = replies["sep05-0756"].card
    assert dead["nextStep"]["key"] == "logger"
    habit = [r for r in dead["settled"] if r["key"] == "habit"][0]
    assert habit["status"] == "wait"
    assert "hot afternoon" in habit["why"]
    assert "logger lost DIFP" in dead["wasted"]


def test_loop_eval_reports_drives_to_proof_and_the_wasted_count(loop: Loop):
    replies = replay(loop)
    by_id = dict(replies)
    order = [(example_id, reply.snapshot()["drive"]["id"]) for example_id, reply in replies]

    # Drives to proof per settled step, from the stored Open steps: uploads
    # after the first ask up to and including the proof.
    steps = {s["key"]: s for s in loop.store.list_open_steps()}
    proof: dict[str, list[str]] = {}
    for key in ("undo", "baseline"):
        asked_on, settled_by = steps[key]["askedOn"], steps[key]["settledBy"]
        assert settled_by, f"{key} was never proven"
        proof[key] = [eid for eid, did in order if asked_on < did <= settled_by]
    assert proof == EXPECTED_PROOF_DRIVES

    # The Wasted drives: every upload that proved nothing.
    wasted = [example_id for example_id, reply in replies if by_id[example_id].card["wasted"]]
    assert wasted == EXPECTED_WASTED_IDS

    print(
        f"Loop eval: Drives to proof — undo: {len(proof['undo'])} "
        f"({', '.join(proof['undo'])}); baseline: {len(proof['baseline'])} "
        f"({', '.join(proof['baseline'])}). Wasted drives: "
        f"{len(wasted)}/9 ({', '.join(wasted)})."
    )


def test_loop_eval_stop_drive_never_yields_a_knock_fix_or_an_afm_curve_edit(loop: Loop):
    replies = dict(replay(loop))
    plan = replies["aug23-2038"].card["flashPlan"]
    assert plan["kind"] == "undo"
    # Any fix would be a table or cell edit. The Undo carries none: no AFM
    # curve edit, no knock fix, nothing else.
    assert plan["tables"] == []
    assert plan["cells"] == []
    assert plan["cellCount"] == 0
    assert plan["afmPasteRow"] is None
    blob = json.dumps(plan["tables"] + plan["cells"]).lower()
    assert "knock" not in blob and "maf" not in blob
    # The AFM lever is locked behind the Undo, and says so: trims off
    # everywhere route to the Undo, never a curve edit.
    afm = [lever for lever in plan["levers"] if lever["id"] == "afm"][0]
    assert afm["status"] == "locked"
    assert "never a curve edit" in afm["reason"]
