"""AD-4: Python decides no number. Every tuning number has one row in data/thresholds.json (or the engine) and arrives in `limits`."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from conftest import OWNER_DRIVES, REPO_ROOT, Loop, owner_csv

from kta_server import copy as C
from kta_server.worker import WorkerError

SERVER = REPO_ROOT / "server" / "kta_server"
HOME = "A tuning number goes in data/thresholds.json (with its source) and reaches Python in `limits`."


@pytest.mark.parametrize("name", ["copy.py", "readback.py"])
def test_the_wording_and_readback_modules_hold_no_number_and_no_fallback(name: str):
    tree = ast.parse((SERVER / name).read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, (ast.Assign, ast.AnnAssign)) and isinstance(node.value, (ast.Constant, ast.UnaryOp)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for t in targets:
                is_number = not isinstance(node.value, ast.Constant) or isinstance(node.value.value, (int, float))
                assert not (isinstance(t, ast.Name) and t.id.isupper() and is_number), f"{name}:{node.lineno} {t.id} is a number. {HOME}"
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "lim":
            assert len(node.args) == 2 and not node.keywords, f"{name}:{node.lineno} lim() takes no fallback. {HOME}"


def test_a_missing_limit_names_its_path_and_is_a_worker_error():
    with pytest.raises(WorkerError, match=r"LIMITS\.trim\.good") as caught:
        C.lim({}, "LIMITS.trim.good")
    assert caught.value.code == "limits-missing"


def test_with_a_worker_that_fails_the_owner_reads_the_worker_error_not_a_stack_trace(tmp_path):
    """A worker that never started, and one that started but reported no limits, end the same readable way."""
    gone, silent = tmp_path / "gone", tmp_path / "silent"
    gone.mkdir(), silent.mkdir()
    for home, code in ((gone, "worker-missing"), (silent, "limits-missing")):
        loop = Loop(home)
        try:
            if code == "worker-missing":
                loop.worker.script = home / "gone.js"
            else:
                loop.start().worker.limits.clear()
            state = loop.get("/api/state")
            assert state.status_code == 502 and state.json()["error"]["code"] == code
            reply = loop.send(loop.upload(owner_csv(OWNER_DRIVES[0][0]), OWNER_DRIVES[0][1]))
            assert not reply.errors() and reply.say == "I could not read that file as a TunerView log."
            assert reply.card["error"]["code"] == code
        finally:
            loop.close()
