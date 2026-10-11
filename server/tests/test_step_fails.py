"""A Boost step that failed its proof stays on record past the Undo (tickets 06, 16).

The Flash plan reads only the drive window, which moves past the failing drives
once the Undo is flashed; the app keeps the plan's `stepFail` in the car state
so the ladder stays closed. No Node worker: a fake one returns the plan.
"""

from __future__ import annotations

import asyncio

from kta_server import flash as FL
from kta_server import questions as Q
from kta_server.db import Store

FAIL = {"at": 300000, "drives": ["pc", "ph"], "fuels": ["E10 RON95 III"], "shut": False}


class FakeWorker:
    ktuner_basemap = "Starter 21 Dual Tune 2"

    def __init__(self, plan):
        self.plan = plan
        self.calls = []

    async def call(self, op, **kwargs):
        self.calls.append((op, kwargs))
        if op == "mapVersions":
            return {"active": None}
        if op == "flashPlan":
            return dict(self.plan)
        raise AssertionError(f"unexpected worker op {op}")


def test_a_failed_boost_step_is_kept_past_the_undo_and_a_rebuild(tmp_path):
    store = Store(tmp_path / "kta.db")
    store.save_car_state({"drives": {}})
    store.add_install("intercooler", installed_at=100000)
    worker = FakeWorker({"kind": "undo", "undo": {"known": False}, "stepFail": FAIL})

    for _ in range(2):  # the same failure is recorded once
        asyncio.run(FL.checked_plan_with_change(worker, store, store.car_state(), {}, 0))
    assert store.car_state()["boostStepFails"] == [FAIL]
    # The plan reads the Installs: only they (or a new fuel) reopen the ladder.
    plan_args = [kw for op, kw in worker.calls if op == "flashPlan"][-1]
    assert [i["part"] for i in plan_args["installs"]] == ["intercooler"]

    # Rebuilding the Car history from events keeps the record.
    assert asyncio.run(Q.rebuild_history(store, worker, 0))["boostStepFails"] == [FAIL]
    assert store.car_state()["boostStepFails"] == [FAIL]


def test_a_stop_undo_records_nothing(tmp_path):
    store = Store(tmp_path / "kta.db")
    store.save_car_state({"drives": {}})
    worker = FakeWorker({"kind": "undo", "undo": {"known": False}, "stepFail": None})
    asyncio.run(FL.checked_plan_with_change(worker, store, store.car_state(), {}, 0))
    assert "boostStepFails" not in store.car_state()
