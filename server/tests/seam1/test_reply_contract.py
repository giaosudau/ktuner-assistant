"""The reply contract: real replies, committed as object literals `tsc` checks against the web's types.

`web/fixtures/replies.fixture.ts` is both the contract check (an unknown or missing key fails the
compiler) and the safety gate for refactors (any change to what an owner reads shows up as a diff).
It is generated here from the session's nine-drive replay, plus typed messages with no key.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any

from conftest import NOW, OWNER_DRIVES, REPO_ROOT, Loop, template_replies

from test_chat_agent import PROFILE, chat

FIXTURE = REPO_ROOT / "web" / "fixtures" / "replies.fixture.ts"
REFRESH = "cd server && KTA_WRITE_REPLIES=1 uv run pytest tests/seam1/test_reply_contract.py -n0"

#: One typed message for each way the no-key front desk answers.
TYPED = ("Hello I want to tune my car", "What can you do?", "I fitted a new intercooler", "why's it so sluggish when it's hot out")

#: Which `/api/state`s (0 is before the first Drive, N after the Nth) are kept only as a digest: most of
#: the replay repeats its neighbours' shape. Before any Drive, the first Drive and the Stop stay in full.
DIGEST_ONLY = {2, 3, 5, 6, 7, 8, 9}

#: Values the clock decides, not the code: the replay's fixed `now` doesn't reach them.
CLOCK_KEYS = {"ms", "received_at", "created_at", "updated_at"}


def normal(value: Any, key: str = "") -> Any:
    """The same replies every run: ids and wall-clock values out, everything else byte for byte."""
    if isinstance(value, dict):
        # Only the harness's `seconds` is a stopwatch: a Drive's `seconds` is a reading.
        return {k: 0 if key == "harness" and k == "seconds" else normal(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [normal(v) for v in value]
    if key in CLOCK_KEYS:
        return 0
    if isinstance(value, str):
        value = re.sub(r"\b[0-9a-f]{32}\b", "<id>", value)
        return re.sub(r"· [0-9.]+ s$", "· 0 s", value)
    return value


def digest(value: Any) -> str:
    return "sha1:" + hashlib.sha1(json.dumps(value, ensure_ascii=False).encode()).hexdigest()[:12]


def fold_harness(card: dict[str, Any]) -> dict[str, Any]:
    """A step's inputs and output are `unknown` to the web and most of the size: a digest still shows a change."""
    for step in card["harness"]["steps"]:
        step["inputs"], step["output"] = digest(step["inputs"]), digest(step["output"])
    return card


def literal(name: str, type_name: str, rows: list[Any]) -> str:
    return f"export const {name}: {type_name}[] = {json.dumps(rows, ensure_ascii=False, indent=0)};\n"


def save_profile(loop: Loop) -> None:
    assert loop.run(loop._client.post("/api/profile", json={"fields": PROFILE})).status_code == 200


def past_the_replay(home: Path) -> tuple[list[Any], list[Any]]:
    """What the profile-less replay never reaches: the stages, a checked change, its Flash, the Drive after it."""
    home.mkdir()
    loop = Loop(home).start()
    try:
        save_profile(loop)
        new_car = loop.get("/api/state").json()
        loop.upload_and_reply(*OWNER_DRIVES[7])
        one_drive = loop.get("/api/state").json()
        car = loop.store.car_state(None)
        for summary in car["drives"].values():
            summary["overshoot"] = 3.4  # over the hold, as test_flash_step.propose: the plan proposes a change
        loop.store.save_car_state(car)
        proposed = loop.get("/api/state").json()
        assert proposed["flashPlan"]["kind"] == "one-family", proposed["flashPlan"]
        flash = {"changeId": proposed["flashPlan"]["ktunerCard"]["changeId"]}
        assert loop.run(loop._client.post("/api/flash/confirm", json=flash)).status_code == 200
        flashed = loop.get("/api/state").json()
        after, repeat = (loop.upload_and_reply(*OWNER_DRIVES[8]) for _ in "ab")
        return [normal(r.card) for r in (after, repeat)], [normal(s) for s in (new_car, one_drive, proposed, flashed)]
    finally:
        loop.close()


def the_verify_state(home: Path) -> Any:
    """A Flash recorded after the last Drive: the stage the replay's fixed clock never reaches."""
    home.mkdir()
    loop = Loop(home).start()
    try:
        save_profile(loop)
        loop.upload_and_reply(*OWNER_DRIVES[7])
        car = loop.store.car_state(None)
        for summary in car["drives"].values():
            summary["overshoot"] = 3.4
        loop.store.save_car_state(car)
        flash = {"changeId": loop.get("/api/state").json()["flashPlan"]["ktunerCard"]["changeId"]}
        object.__setattr__(loop.settings, "now", NOW + 400 * 86_400_000)  # the settings are frozen; the clock is the test's
        assert loop.run(loop._client.post("/api/flash/confirm", json=flash)).status_code == 200
        return normal(loop.get("/api/state").json())
    finally:
        loop.close()


def fixture_text(loop: Loop, home: Path) -> str:
    cards = [normal(reply.card) for reply in template_replies(loop).values()]
    states = [normal(state) for state in loop._template_states]

    # On this test's own copy of the replay: a Car profile, then a typed turn per front-desk answer.
    save_profile(loop)
    states.append(normal(loop.get("/api/state").json()))
    answers = [normal(chat(loop, text)) for text in TYPED]
    more_cards, more_states = past_the_replay(home)
    cards += more_cards
    states += more_states
    states.append(the_verify_state(home.parent / "verify"))
    assert {s["stage"] for s in states} == {"car", "baseline", "calibrate", "read", "plan", "verify"}

    # Every state's digest is a gate; the full literal only where the shape differs (see DIGEST_ONLY).
    digests = [digest(state) for state in states]
    return (
        f"// Generated: do not edit. Real replies, checked by `tsc`. To refresh: {REFRESH}\n"
        f"// Every state, in order, including those only kept as a digest: {' '.join(digests)}\n"
        'import type { AskAnswer, LoopState } from "../lib/api";\n'
        'import type { ReplyCard } from "../lib/types";\n\n'
        + literal("replies", "ReplyCard", [fold_harness(c) for c in cards])
        + "\n" + literal("states", "LoopState", [s for i, s in enumerate(states) if i not in DIGEST_ONLY])
        + "\n" + literal("answers", "AskAnswer", answers)
    )


def test_the_committed_replies_are_what_the_server_sends(replayed: Loop, tmp_path: Path):
    text = fixture_text(replayed, tmp_path / "one-drive")
    if os.environ.get("KTA_WRITE_REPLIES"):
        FIXTURE.write_text(text, encoding="utf-8")
    assert text == FIXTURE.read_text(encoding="utf-8"), f"What the server sends changed from web/fixtures/replies.fixture.ts. If that is right, refresh it: {REFRESH}"


def test_the_fixture_holds_a_state_for_every_stage_an_owner_can_be_in():
    """The Stages whose words and chips differ must stay pinned: the calibrate and verify ones are the easy to lose."""
    text = FIXTURE.read_text(encoding="utf-8")
    for stage in ("car", "baseline", "calibrate", "read", "plan", "verify"):
        assert f'"stage": "{stage}"' in text, f"web/fixtures/replies.fixture.ts has no {stage} state: {REFRESH}"
