"""Seam 1: the front door. The worker boundary, the routes, and a bad file.

Nothing here reaches the network and nothing here has a key: the engine is the
only thing the reply can be made of, and a failure comes back as a sentence the
owner can act on, never as a stack trace.
"""

from __future__ import annotations

import json

import pytest

from conftest import Loop, owner_csv

from kta_server.worker import WorkerError


# -- the worker protocol ---------------------------------------------------
def test_an_unknown_worker_op_is_a_code_and_a_sentence_never_a_stack_trace(loop: Loop):
    with pytest.raises(WorkerError) as caught:
        loop.run(loop.worker.call("nope", x=1))
    assert caught.value.code == "unknown-op"
    assert "at Object." not in caught.value.message
    assert "Traceback" not in caught.value.message
    assert caught.value.as_dict() == {"message": caught.value.message, "code": "unknown-op"}


def test_a_drive_that_is_not_in_the_cache_says_so_and_names_the_op(loop: Loop):
    with pytest.raises(WorkerError) as caught:
        loop.run(loop.worker.call("overview", driveId="20260101-000000"))
    assert caught.value.code == "no-log"
    assert "loadLog" in caught.value.message


def test_a_file_that_is_not_a_tuner_view_log_is_rejected_with_a_readable_reason(loop: Loop):
    upload_id = loop.upload("this is not a csv\n", "notes.csv")
    with pytest.raises(WorkerError) as caught:
        loop.run(loop.worker.call("ingestUpload", csv="this is not a csv\n", fileName="notes.csv", now=0))
    assert caught.value.code in {"unreadable-csv", "engine-error"}
    assert "Traceback" not in caught.value.message


def test_the_worker_hands_back_the_engines_own_limits_and_never_a_raw_row(loop: Loop):
    limits = loop.worker.limits
    assert limits["LIMITS"]["mixture"]["target"] == 11.0
    assert limits["LIMITS"]["mixture"]["leanLimit"] == 12.0
    assert limits["LIMITS"]["trim"]["good"] == 5
    assert limits["CAR_RULES"]["minMoving"] == 60
    assert limits["CAR_RULES"]["coolIat"] == 42
    assert loop.worker.ktuner_basemap == "Starter 21 Dual Tune 2"

    reply = loop.upload_and_reply("aug30-1529")
    overview = [s for s in reply.harness_steps() if s["name"] == "overview"][0]
    assert overview["output"]["verdict"] in {"good", "watch", "stop", "nodata"}
    # A summary, not the log: no channel arrays, no timeline.
    blob = json.dumps(reply.harness_steps())
    assert "timeline" not in blob
    assert len(blob) < 60_000


# -- the routes -------------------------------------------------------------
def test_healthz_says_the_worker_is_up(loop: Loop):
    assert loop.get("/healthz").text.strip() == "ok"


def test_api_state_carries_the_car_history_the_baseline_and_the_open_steps(loop: Loop):
    loop.upload_and_reply("sep01-0813")
    loop.upload_and_reply("sep05-0756")
    body = loop.get("/api/state").json()

    assert body["ktunerBasemap"] == "Starter 21 Dual Tune 2"
    assert [row["id"] for row in body["carHistory"]] == ["20260901-081358", "20260905-075634"]
    assert body["baseline"] == {"value": 0.49, "n": 2}
    assert body["flashPlan"]["kind"] == "no-change"
    # Ticket 04: every Open step carries its own status, and the panel shows the
    # ones still to do. 01 Sep is itself a Cool Drive with 2 pulls, so it set the
    # Baseline (tuning-shop live run); left: the two channels to add, and the
    # logger the 05 Sep Drive opened.
    assert [s["key"] for s in body["openSteps"]] == ["channels", "logger"]
    assert body["openSteps"][0]["why"], "each Open step says why it is where it is"
    assert body["openSteps"][0]["title"].startswith("Log AFR Command")
    # Every seam a later ticket needs is present, even if empty for now.
    for key in ("carProfile", "mapVersions", "installs", "flashes", "answers", "unansweredQuestions", "hasLlm"):
        assert key in body
    assert body["hasLlm"] is False, "no key in this test: the reply is the built-in one"


def test_the_history_file_exports_the_car_history_without_the_raw_csv(loop: Loop):
    loop.upload_and_reply("sep01-0813")
    response = loop.get("/api/history")
    doc = response.json()
    assert "20260901-081358" in doc["drives"]
    assert "raw_csv" not in json.dumps(doc)
    assert len(json.dumps(doc)) < 40_000


def test_uploading_the_same_drive_twice_replaces_it_and_the_count_does_not_grow(loop: Loop):
    first = loop.upload_and_reply("sep01-0813")
    second = loop.upload_and_reply("sep01-0813")
    assert first.card["say"] == second.card["say"]
    assert len(loop.store.car_state(None)["drives"]) == 1
    assert len(loop.store.list_drives()) == 1


def test_the_chat_keeps_its_thread_and_the_owners_messages(loop: Loop):
    loop.upload_and_reply("sep01-0813")
    messages = loop.store.list_messages(loop.thread_id)
    assert [m["role"] for m in messages] == ["assistant"]
    assert messages[0]["drive_id"] == "20260901-081358"
    assert loop.thread_id in [t["id"] for t in loop.store.list_threads()]


def test_a_bad_upload_says_it_could_not_be_read_instead_of_crashing(loop: Loop):
    upload_id = loop.upload("Timestamp;Engine RPM\n1;2\n", "TunerView_20260101_000000.csv")
    reply = loop.send(upload_id)
    assert reply.errors() == []
    assert reply.say.startswith("I could not read that file")
    assert reply.snapshot()["reply"]["error"]["code"]


# -- Map versions -----------------------------------------------------------
def test_the_worker_names_map_version_one_and_holds_its_tables(loop: Loop):
    """The engine's own version list; its tables come out only when asked."""
    versions = loop.run(loop.worker.call("mapVersions"))
    assert [v["label"] for v in versions["versions"]] == ["Map version 1"]
    assert versions["active"]["name"] == "Starter 21 Dual Tune 2"
    assert versions["active"]["tablesFrom"] == "ktuner-basemap"
    assert versions["active"]["tablesHeld"] is True
    assert versions["active"]["tableCount"] == 39

    held = loop.run(loop.worker.call("mapVersion", version=1))
    assert held["version"]["label"] == "Map version 1"
    assert len(held["tables"]["MAF_Scaling_Custom"]["values"][0]) == 103
    assert held["tables"]["Boost_Target_1_Normal_L"]["values"][0]


def test_naming_a_map_version_that_does_not_exist_says_which_ones_there_are(loop: Loop):
    with pytest.raises(WorkerError) as caught:
        loop.run(loop.worker.call("mapVersion", version=7))
    assert caught.value.code == "no-map-version"
    assert "Map version 1" in caught.value.message
    assert "Traceback" not in caught.value.message


def test_a_proposed_change_can_be_planned_against_a_named_map_version(loop: Loop):
    """The seam the two map checks (ADR 0003) need: a plan names its Map version."""
    state = loop.store.car_state(None)
    active = loop.run(loop.worker.call("flashPlan", state=state, now=1756723200000))
    assert active["mapVersion"]["n"] == 1
    named = loop.run(loop.worker.call("flashPlan", state=state, now=1756723200000, mapVersion=1))
    assert named["mapVersion"]["label"] == "Map version 1"
    assert named["headline"] == active["headline"]


def test_a_map_version_whose_change_is_not_stored_yet_cannot_be_checked(loop: Loop):
    """A Flash the app has not stored the change for never borrows an older map."""
    flashed = loop.run(loop.worker.call(
        "recordFlash",
        flash={"time": 1756723200000, "map": "Starter 21 r2", "changed": "afm"},
        now=1756723200000,
    ))
    assert flashed["version"]["n"] == 2
    assert flashed["version"]["tablesPending"] is True
    with pytest.raises(WorkerError) as caught:
        loop.run(loop.worker.call("mapVersion", state=flashed["state"], version=2))
    assert caught.value.code == "map-change-pending"
    assert "Map version 2" in caught.value.message
    # The plan can still be read against the map the change was written on, and it
    # says which version it was written on.
    plan = loop.run(loop.worker.call("flashPlan", state=flashed["state"], now=1756723200000))
    assert plan["mapVersion"]["n"] == 2
    assert plan["mapVersion"]["tablesPending"] is True