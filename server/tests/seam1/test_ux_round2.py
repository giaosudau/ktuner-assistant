"""Seam 1: UX round 2 on the server — the Undo as numbered steps, and the re-upload note.

R2-4. The Undo Next step is one sentence why, then three numbered steps: save today's map,
      flash the file from before, drive the Shakedown and attach the log. No "Stop open".
R2-9. A re-upload of a Drive already in the Car history says so in one line (`repeat`).
"""

from __future__ import annotations

from conftest import Loop, owner_csv, template_replies

from test_reply_words import decided, step_undo

from kta_server import copy as C


# ---------------------------------------------------------------------------
# R2-4. The Undo as three numbered steps
# ---------------------------------------------------------------------------
def test_the_stop_drive_undo_is_one_why_and_three_numbered_steps(replayed: Loop):
    step = template_replies(replayed)["aug23-2038"].card["nextStep"]
    assert step["key"] == "undo" and step["kind"] == "flash"
    assert step["title"] == "Put the map from before back on the car"
    # One sentence why: what the log showed, no engine lead-in.
    body = step["body"]
    assert "Stop open" not in body and "−21.4 %" in body, body
    assert body.count(". ") == 0 and body.endswith("."), body
    steps = step["recipe"]["steps"]
    assert steps == [
        "In KTuner, save today's map under a new name so nothing is lost.",
        "Open the file you ran before this drive and flash it.",
        "Drive 10 calm minutes (the Shakedown), then attach the log here.",
    ]
    # What it proves and when to upload are unchanged.
    assert step["proves"] == "trims back within ±5 % over 10 calm minutes"
    assert step["upload"] == "after the first calm drive on the old file"
    assert step["flashPlan"]["kind"] == "undo"


def test_a_known_map_version_is_named_in_the_flash_back_step():
    plan = {
        "kind": "undo",
        "headline": "Stop open: flash your previous map file (Map version 1 · Starter 21 Dual Tune 2).",
        "undo": {"known": True, "version": 1, "name": "Starter 21 Dual Tune 2", "stamp": "20260823-200000"},
    }
    step = decided(step_undo(), plan)
    assert "Stop open" not in step["body"]
    assert step["recipe"]["steps"][1] == (
        "Open the file you ran before this drive "
        "(Map version 1 · Starter 21 Dual Tune 2, flashed 23 Aug 20:00) and flash it."
    )
    # The flash-back card still rides on the plan.
    assert step["flashPlan"] is plan


# ---------------------------------------------------------------------------
# R2-9. "I read this drive before."
# ---------------------------------------------------------------------------
def test_a_second_upload_of_the_same_csv_says_it_was_read_before(loop: Loop):
    csv, name = owner_csv("aug22-0903"), "TunerView_20260822_090322.csv"
    first = loop.send(loop.upload(csv, name))
    assert not first.errors(), first.errors()
    assert first.card.get("repeat") is None
    first_at = loop.store.drive("20260822-090322")["received_at"]

    again = loop.send(loop.upload(csv, name))
    assert not again.errors(), again.errors()
    repeat = again.card["repeat"]
    first_upload = loop.store.get_upload(loop.store.drive("20260822-090322")["upload_id"])
    assert repeat["at"] == first_upload["received_at"] and repeat["at"] <= first_at
    assert repeat["line"] == (
        f"I read this drive before, on {C.stamp_day(repeat['at'])}: nothing new is added to your car file."
    )
    assert len(loop.store.list_drives()) == 1

