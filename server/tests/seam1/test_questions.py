"""Seam 1: owner questions pause, answer, resume (ticket 07).

The engine asks what only the owner knows as tap-to-answer choices; answering
persists, applies through engine operations at its point in time (a Flash
before the Drive it explains, an Unexplained-change mark after it), rebuilds
the Car history from events, and re-decides the Next step. No key, no network,
no LLM: scripted answers through `POST /api/answer`, then the reply events.
"""

from __future__ import annotations

import json

from conftest import Loop, owner_csv, OWNER_FILE_NAMES, template_replies


def upload_all(replayed: Loop) -> dict:
    """The owner's nine Drives in order, as nine replies (replayed once)."""
    return template_replies(replayed)


def answer(replayed: Loop, kind: str, drive_id: str, choice: str) -> dict:
    """One tap-to-answer choice, as the reply card sends it."""
    response = replayed.run(
        replayed._client.post(
            "/api/answer", json={"kind": kind, "driveId": drive_id, "choice": choice}
        )
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_the_fault_drive_asks_what_changed_and_housing_as_tap_choices(replayed: Loop):
    replies = upload_all(replayed)
    card = replies["aug23-2038"].card
    questions = card.get("questions") or []
    assert [q["kind"] for q in questions] == ["what-changed", "housing"]
    changed = questions[0]
    assert changed["question"].startswith("What changed")
    assert [c["id"] for c in changed["choices"]] == ["maf", "other-flash", "part", "nothing"]
    assert [c["label"] for c in changed["choices"]] == [
        "I flashed, changing MAF Scaling",
        "I flashed something else",
        "I fitted a part, no flash",
        "Nothing I know of",
    ]
    housing = questions[1]
    assert housing["question"] == "Which intake housing is fitted?"
    assert [c["id"] for c in housing["choices"]] == ["factory", "hvi", "race", "won", "unsure"]
    # Plain owner words: no table name in any question or choice.
    blob = json.dumps(questions)
    for table in ("MAF_Scaling_Custom", "WOT_Enrich", "Boost_Target", "Final_Boost"):
        assert table not in blob


def test_scripted_answers_name_the_undo_file_and_pass_the_shakedown(replayed: Loop):
    replies = upload_all(replayed)
    stop_id = replies["aug23-2038"].snapshot()["drive"]["id"]
    shake_id = replies["aug30-1529"].snapshot()["drive"]["id"]

    # Before answers: the Undo names no file — nothing was recorded.
    assert replies["aug23-2038"].card["flashPlan"]["undo"]["known"] is False

    # "I flashed, changing MAF Scaling" records the bad Flash before 20:38.
    out = answer(replayed, "what-changed", stop_id, "maf")
    assert out["ok"] is True

    # "Yes, the old file back" records the Undo flash before the Shakedown drive.
    out = answer(replayed, "did-flash", shake_id, "undo")
    assert out["nextStep"]["key"] in {"baseline", "undo", "habit", "none", "drive", "flash", "watch"}

    # 20:38's Undo now names the Map version 1 file.
    state = replayed.get("/api/state").json()
    flashes = {f["id"]: f for f in state["flashes"]}
    assert any("MAF Scaling changed" in f["map"] for f in flashes.values()), flashes

    car_state = replayed.store.car_state(None)
    assert len([v for v in car_state["mapVersions"] if v["n"] == 1]) == 1
    v1 = [v for v in car_state["mapVersions"] if v["n"] == 1][0]
    assert v1["name"] == "Starter 21 Dual Tune 2"

    # The bad flash made 20:38 the first Drive on Map version 2, so Undo names v1.
    # The proof is in the rebuilt history: 20:38 runs on version 2, 15:29 (the
    # Undo flash back) runs on version 3 — and 15:29 is a passed Shakedown.
    history = replayed.run(replayed.worker.call("carHistory", state=car_state))
    by_id = {r["id"]: r for r in history["rows"]}
    assert by_id[stop_id]["mapVersion"] == 2, by_id[stop_id]
    assert by_id[shake_id]["mapVersion"] == 3, by_id[shake_id]

    # 15:29 passes as the Shakedown drive: 10 calm minutes, trims within ±5 %.
    summary = car_state["drives"][shake_id]
    assert summary["shakedown"] == "passed", summary["shakedown"]
    assert summary["calmSec"] >= 600
    assert abs(summary["trimWorst"]) <= 5


def test_not_sure_stays_on_the_undo_file_with_no_maf_option(replayed: Loop):
    replies = upload_all(replayed)
    stop_id = replies["aug23-2038"].snapshot()["drive"]["id"]
    answer(replayed, "what-changed", stop_id, "maf")
    out = answer(replayed, "housing", stop_id, "unsure")
    assert out["housing"] is not None
    assert out["housing"]["option"] is None, out["housing"]
    assert "Undo file" in out["housing"]["detail"]
    # And the Flash plan still carries no MAF Scaling option: Undo, zero cells.
    car_state = replayed.store.car_state(None)
    plan = replayed.run(replayed.worker.call("flashPlan", state=car_state, now=1756723200000))
    assert plan["cellCount"] == 0


def test_housing_routes_inside_the_ktuner_box(replayed: Loop):
    replies = upload_all(replayed)
    stop_id = replies["aug23-2038"].snapshot()["drive"]["id"]
    answer(replayed, "what-changed", stop_id, "maf")
    for choice, option in (
        ("factory", "Factory"), ("hvi", "Factory"), ("race", "PRL Race"), ("won", "27Won Race"),
    ):
        out = answer(replayed, "housing", stop_id, choice)
        assert out["housing"]["option"] == option, (choice, out["housing"])
    out = answer(replayed, "housing", stop_id, "hvi")
    assert "calm drive must show" in out["housing"]["detail"]


def test_an_answer_can_be_changed_and_the_history_re_derives(replayed: Loop):
    replies = upload_all(replayed)
    stop_id = replies["aug23-2038"].snapshot()["drive"]["id"]
    answer(replayed, "what-changed", stop_id, "maf")
    first = dict(replayed.store.list_question_answers())
    assert first[f"what-changed:{stop_id}"]["choice"] == "maf"
    # A wrong tap never sticks: answer again and the row overwrites.
    out = answer(replayed, "what-changed", stop_id, "nothing")
    assert out["choice"] == "nothing"
    second = dict(replayed.store.list_question_answers())
    assert second[f"what-changed:{stop_id}"]["choice"] == "nothing"
    assert len(second) == len(first), "one row per question, never a second one"
    # The Flash the first answer recorded is withdrawn by the changed answer:
    # no "MAF Scaling changed" flash row remains for this question.
    state = replayed.get("/api/state").json()
    assert not any(
        f["id"] == f"q-what-changed-{stop_id}" for f in state["flashes"]
    ), [f["id"] for f in state["flashes"]]
    # Re-answering the flash brings it back.
    answer(replayed, "what-changed", stop_id, "maf")
    state = replayed.get("/api/state").json()
    assert any("MAF Scaling changed" in f["map"] for f in state["flashes"])


def test_unanswered_questions_wait_beside_the_thread(replayed: Loop):
    upload_all(replayed)
    body = replayed.get("/api/state").json()
    waiting = [(q["id"], q["title"]) for q in body["unansweredQuestions"]]
    assert waiting == [
        ("what-changed:20260823-203853", "What changed"),
        ("housing:20260823-203853", "Which intake housing is fitted"),
        ("did-flash:20260830-152931", "Did you flash"),
    ], waiting


def test_answers_persist_across_a_restart(replayed: Loop):
    replies = upload_all(replayed)
    stop_id = replies["aug23-2038"].snapshot()["drive"]["id"]
    shake_id = replies["aug30-1529"].snapshot()["drive"]["id"]
    answer(replayed, "what-changed", stop_id, "maf")
    answer(replayed, "housing", stop_id, "factory")
    answer(replayed, "did-flash", shake_id, "undo")

    restarted = replayed.restart()
    try:
        saved = restarted.store.list_question_answers()
        assert saved[f"what-changed:{stop_id}"]["choice"] == "maf"
        assert saved[f"housing:{stop_id}"]["choice"] == "factory"
        assert saved[f"did-flash:{shake_id}"]["choice"] == "undo"
        body = restarted.get("/api/state").json()
        assert body["unansweredQuestions"] == [], body["unansweredQuestions"]
        car_state = restarted.store.car_state(None)
        assert car_state["drives"][shake_id]["shakedown"] == "passed"
    finally:
        restarted.close()
