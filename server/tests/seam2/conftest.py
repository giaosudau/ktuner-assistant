"""Seam 2: the two-sided map check (ADR 0003, ticket 12).

The engine's `KTA.checkMapChange` and the independent Python
`kta_server.mapcheck.check_change` get the same generated changes and must
agree on every one. Any disagreement fails with both verdicts. No key and no
network: the engine runs through a small Node bridge over its public check
function, never through the worker.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest

SERVER_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = SERVER_ROOT.parent
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from kta_server import mapcheck  # noqa: E402
from kta_server import mapdata  # noqa: E402

BRIDGE = Path(__file__).resolve().parent / "run_engine_check.js"


@pytest.fixture(scope="session")
def thresholds() -> dict[str, Any]:
    return mapcheck.load_thresholds()


@pytest.fixture(scope="session")
def basemap() -> dict[str, Any]:
    return mapdata.basemap_tables()


def engine_verdict(change: dict[str, Any], tables: dict[str, Any], tmp_path: Path) -> dict[str, Any]:
    """The engine's verdict on one change, through the Node bridge."""
    case_file = tmp_path / "case.json"
    case_file.write_text(json.dumps({"change": change, "tables": tables}), encoding="utf-8")
    proc = subprocess.run(
        ["node", str(BRIDGE), str(case_file)],
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode == 0, f"the engine bridge failed: {proc.stderr}"
    return json.loads(proc.stdout)


def check_both(
    name: str,
    change: dict[str, Any],
    tables: dict[str, Any],
    tmp_path: Path,
) -> None:
    """Both checks on one change: agree, or fail showing both reasons."""
    mine = mapcheck.check_change(change, tables)
    theirs = engine_verdict(change, tables, tmp_path)
    assert (mine["ok"], mine["reason"]) == (theirs["ok"], theirs["reason"]), (
        f"{name}: disagreement — "
        f"Python says ok={mine['ok']} reason={mine['reason']} ({mine['detail']}), "
        f"engine says ok={theirs['ok']} reason={theirs['reason']}"
    )
