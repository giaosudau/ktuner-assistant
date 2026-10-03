"""Summaries-only guard (ADR 0004): what the worker returns is a fixed summary
shape, never a raw log, CSV or whole table. One place defines it: `summarize`."""

import json
import subprocess

from pathlib import Path

from conftest import owner_csv

ROOT = Path(__file__).resolve().parents[3]
NOW = 1700000000000


def call(op, **args):
    p = subprocess.run(
        ["node", "server/kta_worker/worker.js"], cwd=ROOT, capture_output=True, text=True,
        input=json.dumps({"id": "1", "op": op, "args": args}) + "\n",
    )
    out = json.loads(p.stdout)
    assert out["ok"], out
    return out["result"]


VERSION = {"n", "label", "name", "kind", "tablesFrom", "tablesPending", "tablesHeld", "from",
           "flashId", "changed", "note", "updatedAt", "tableCount"}
DRIVE = {"id", "tooShort", "replaced", "firstDrive", "verdict", "verdictWord", "baseline", "map",
         "isShakedown", "shakedown", "flashCause", "hardDrivingWatch", "unexplained", "afterFlash",
         "unexplainedWatch", "hotRestart", "summary", "numbers"}
PLAN = {"kind", "changeId", "family", "headline", "route", "basis", "proof", "saveAs", "undoName",
        "undo", "mapVersion", "ceilingPsi", "tables", "cellCount", "cells", "afmPasteRow",
        "evidence", "deferred", "levers", "openIssues"}


def test_ops_return_summary_shapes_only():
    csv = owner_csv("aug23-1959")
    base = call("recordBasemap", now=NOW)
    assert set(base["version"]) == VERSION

    up = call("ingestUpload", csv=csv, fileName="a.csv", state=base["state"], now=NOW)
    assert set(up["drive"]) == DRIVE
    assert up["drive"]["map"] is None or "recorded" in up["drive"]["map"]
    state = up["state"]

    vs = call("mapVersions", state=state)
    assert set(vs["active"]) == VERSION and all(set(v) == VERSION for v in vs["versions"])

    hist = call("carHistory", state=state)
    assert all(set(v) == VERSION for v in hist["mapVersions"])

    plan = call("flashPlan", state=state, now=NOW)
    assert set(plan) == PLAN
    assert all(set(t) == {"id", "kind", "cellCount", "pasteRow"} for t in plan["tables"])

    ans = call("answerDrive", state=state, driveId=up["drive"]["id"], answer="neither")
    assert set(ans["report"]) == DRIVE

    # The summaries never carry the upload itself.
    for out in (up["drive"], vs, plan, ans["report"]):
        text = json.dumps(out)
        assert csv[:200] not in text and "\\n" * 50 not in text
