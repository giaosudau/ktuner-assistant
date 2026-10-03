"""Suite-wide guardrails for the Python test suite (infra ticket: fast suite).

Two rules live here so a slow suite fails loudly instead of creeping back:

1. SUITE_BUDGET_SECONDS below: the full run (`cd server && uv run pytest
   tests -q`) must finish inside it. The number is recorded here, not in CI,
   because there is no CI workflow yet — when one exists, it should call the
   same canonical command and this same budget enforces itself.
2. `--durations=10` in pyproject addopts prints the slowest phases every run.

The budget comfortably clears a healthy run (about 10-15 s on an 8-core Mac
with xdist, about a minute single-process) and trips long before the old
145-second suite could return: the historical cost was ~30 full nine-drive
replays, and any change that reintroduces per-test replays adds ~3 s each.
"""

from __future__ import annotations

import time

import pytest

# Recorded wall-time budget for the whole suite, collection included. Raise it
# only with a measured reason written down next to the new number.
SUITE_BUDGET_SECONDS = 90


def pytest_configure(config: pytest.Config) -> None:
    config._kta_suite_start = time.monotonic()


def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    start = getattr(session.config, "_kta_suite_start", None)
    if start is None:  # pragma: no cover - configure always sets it
        return
    elapsed = time.monotonic() - start
    session.config._kta_suite_seconds = elapsed
    if elapsed > SUITE_BUDGET_SECONDS and exitstatus == 0:
        session.config._kta_suite_over_budget = True
        session.exitstatus = pytest.ExitCode.TESTS_FAILED


def pytest_terminal_summary(terminalreporter, exitstatus, config) -> None:
    elapsed = getattr(config, "_kta_suite_seconds", None)
    if elapsed is None:  # pragma: no cover - finish always sets it
        return
    terminalreporter.write_sep(
        "=",
        f"suite wall time {elapsed:.1f} s (budget {SUITE_BUDGET_SECONDS} s)",
    )
    if getattr(config, "_kta_suite_over_budget", False):
        terminalreporter.write_line(
            f"SUITE BUDGET EXCEEDED: {elapsed:.1f} s > {SUITE_BUDGET_SECONDS} s. "
            "Find the new slow phase in --durations above, then fix the fixture "
            "(replay once, assert many) instead of raising this number.",
            red=True,
        )
