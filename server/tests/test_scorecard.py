"""Eval layers 2 and 3, offline half (ticket 16): no key, no network, fast.

What runs here: the failure-class classifier against real `verify` output,
the shared banned-advice parity list (Python side), the judge parsing and
owner-agreement math, the owner-gradeable sample shape, the env gate, and the
no-key skip. The live replay (fake models through the front door) is gated
behind `KTA_SCORECARD=1` in `seam1/test_scorecard.py`, so the default suite
stays flat.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kta_server import scorecard as S
from kta_server import verify as V

FACTS = [0.49, 0.65, 1.6, 53.0, -2.4, 2.0, 10.8, 11.0, 12.0, 42.0, 48.0, 1.0, 5.0]
PLAN = {
    "kind": "no-change",
    "headline": "Your logs support no map change right now.",
    "ceilingPsi": 21,
    "tables": [],
    "cells": [],
}
BOOST_PLAN = {
    "kind": "flash",
    "headline": "Trim boost.",
    "ceilingPsi": 21,
    "tables": [{"id": "Boost_Target_1_Normal_L"}],
    "cells": [{"table": "Boost_Target_1_Normal_L", "row": 9, "col": 9, "before": 17.0, "after": 16.0}],
}
CARD_141 = {
    "id": "kc-t",
    "title": "T",
    "numbers": [{"name": "x", "value": 14.1, "unit": "afr"}],
}


def first_issue(prose, **kwargs):
    params = {"action_key": "baseline", "decided": "baseline", "facts": FACTS, "plan": PLAN, "cells": []}
    params.update(kwargs)
    verdict = V.verify(
        prose, params["action_key"], params["decided"], params["facts"],
        params["plan"], params["cells"], knowledge=params.get("knowledge"),
    )
    assert verdict["issues"], f"expected a failure for {prose!r}"
    return verdict["issues"][0]


# -- the five failure classes, against real verify output --------------------
def test_an_invented_number_is_a_wrong_number():
    issue = first_issue("Knock Control peaked at 0.83.")
    assert S.classify_issue(issue) == "wrong number"


def test_a_card_number_without_a_cite_is_an_uncited_claim():
    issue = first_issue(
        "E10 burns at 14.1 on the scale, not 14.7.", knowledge=[CARD_141],
    )
    assert "cite the card" in issue
    assert S.classify_issue(issue, [14.1]) == "uncited claim"


def test_an_unknown_card_is_an_uncited_claim():
    issue = first_issue("E10 burns at 14.1 on the scale. [kc-nope]", knowledge=[CARD_141])
    assert "not a card this run read" in issue
    assert S.classify_issue(issue, [14.1]) == "uncited claim"


def test_a_different_step_is_a_wrong_action():
    issue = first_issue("Keep the revs up.", action_key="undo")
    assert S.classify_issue(issue) == "wrong action"


def test_an_off_plan_cell_is_a_wrong_cell():
    issue = first_issue(
        "Flash the planned cell.",
        plan=BOOST_PLAN,
        cells=[{"table": "Boost_Target_1_Normal_L", "row": 3, "col": 3, "before": 17.0, "after": 16.0}],
    )
    assert S.classify_issue(issue) == "wrong cell"


def test_a_table_outside_the_plan_is_a_wrong_cell():
    issue = first_issue("Check the Boost_Target_9_Xyz table.", plan=BOOST_PLAN)
    assert S.classify_issue(issue) == "wrong cell"


def test_banned_advice_is_a_banned_advice():
    issue = first_issue("Lower the knock sensitivity a little.")
    assert S.classify_issue(issue) == "banned advice"


def test_classes_cover_the_ticket_list_with_zeros_kept():
    counts = S.classify_issues(["mystery issue"])
    assert [k for k in counts if k != "other"] == list(S.FAILURE_CLASSES)
    assert counts["other"] == 1


# -- the judge ----------------------------------------------------------------
def test_judge_parsing_takes_bools_and_abstains_on_junk():
    good = S.parse_judge_reply('{"one_action": true, "plain_words": false, "named_drive": true}')
    assert good == {"one_action": True, "plain_words": False, "named_drive": True}
    junk = S.parse_judge_reply("looks good to me")
    assert junk == {"one_action": None, "plain_words": None, "named_drive": None}
    mixed = S.parse_judge_reply('{"one_action": "yes", "plain_words": true}')
    assert mixed == {"one_action": None, "plain_words": True, "named_drive": None}


async def _fake_chat_ok(messages):
    assert "Reply:" in messages[1]["content"]
    return '{"one_action": true, "plain_words": true, "named_drive": false}'


async def _fake_chat_down(messages):
    raise ConnectionError("offline")


def test_judge_scores_and_abstains_without_raising():
    import asyncio

    scored = asyncio.run(S.judge_clarity("say", "step", "when", _fake_chat_ok))
    assert scored == {"one_action": True, "plain_words": True, "named_drive": False}
    abstained = asyncio.run(S.judge_clarity("say", "step", "when", _fake_chat_down))
    assert abstained == {"one_action": None, "plain_words": None, "named_drive": None}


def test_agreement_counts_only_what_the_judge_answered():
    full = S.agreement(
        {"one_action": True, "plain_words": True, "named_drive": True},
        {"one_action": True, "plain_words": False, "named_drive": True},
    )
    assert (full["matched"], full["total"], full["rate"]) == (2, 3, pytest.approx(2 / 3))
    partial = S.agreement(
        {"one_action": True, "plain_words": None, "named_drive": None},
        {"one_action": False, "plain_words": False, "named_drive": False},
    )
    assert (partial["matched"], partial["total"], partial["rate"]) == (0, 1, 0.0)


def test_owner_grades_round_trip_and_report(tmp_path: Path):
    grades_file = tmp_path / "owner-grades.json"
    grades_file.write_text(
        json.dumps({"samples": {"s1": {"one_action": True, "plain_words": True, "named_drive": False}}}),
        encoding="utf-8",
    )
    grades = S.read_owner_grades(grades_file)
    report = S.report_agreement(
        [{"id": "s1", "judge": {"one_action": True, "plain_words": True, "named_drive": True}},
         {"id": "s2", "judge": {"one_action": True, "plain_words": True, "named_drive": True}}],
        grades,
    )
    assert report["samples"] == [{"id": "s1", "matched": 2, "total": 3, "rate": pytest.approx(2 / 3)}]
    assert (report["matched"], report["total"]) == (2, 3)


# -- the owner-gradeable sample ------------------------------------------------
PROSE = (
    "Engine healthy on this drive. Log one cool-morning drive with 2 pulls. "
    "Upload when: a cool morning with 2 pulls."
)


def test_the_clarity_sample_grades_in_under_a_minute(tmp_path: Path):
    path = tmp_path / "sample.md"
    S.write_clarity_sample(
        path,
        "fake-model",
        "2026-10-03",
        [{
            "id": "fake-model-1",
            "drive": "aug30-1601",
            "prose": PROSE,
            "step_title": "Log one cool-morning drive with 2 pulls",
            "upload_when": "Upload when: a cool morning with 2 pulls.",
            "judge": {"one_action": True, "plain_words": True, "named_drive": True},
        }],
    )
    text = path.read_text(encoding="utf-8")
    assert "Drive aug30-1601" in text
    assert PROSE in text
    for question in S.JUDGE_QUESTIONS:
        assert text.count(question) == 2, question  # once judged, once as the form
    assert text.count("- [ ]") == 3, "three yes/no ticks per sample"
    assert "Knock Control" not in text, "owner words: Fuel-quality score, never bare Knock Control"


# -- the rollup and the table --------------------------------------------------
def test_summarize_shares_and_first_draft_classes():
    records = [
        {"kind": "drive", "id": "a", "status": "first", "first_issues": [], "card_numbers": []},
        {"kind": "drive", "id": "b", "status": "repaired",
         "first_issues": ["These numbers are not in any tool result: 0.91. Quote tool numbers exactly (rounding is fine) and do not compute new ones."],
         "card_numbers": []},
        {"kind": "question", "id": "q", "status": "fallback",
         "first_issues": ["The reply suggests 'Lower the knock sensitivity', which this app never does for this car. Remove it or say why not to."],
         "card_numbers": []},
        {"kind": "drive", "id": "c", "status": "skipped", "first_issues": [], "card_numbers": []},
    ]
    totals = S.summarize(records)
    assert (totals["replies"], totals["judged"], totals["skipped"]) == (4, 3, 1)
    assert (totals["first"], totals["repaired"], totals["fallback"]) == (1, 1, 1)
    assert totals["first_share"] == pytest.approx(1 / 3)
    assert totals["classes"]["wrong number"] == 1
    assert totals["classes"]["banned advice"] == 1


def test_the_table_names_the_model_and_the_five_classes():
    table = S.render_table({"m": {"judged": 3, "first_share": 1.0, "repaired_share": 0.0,
                                  "fallback_share": 0.0, "classes": dict.fromkeys([*S.FAILURE_CLASSES, "other"], 0)}})
    assert "model" in table.splitlines()[0] and "m" in table
    for name in S.FAILURE_CLASSES:
        assert name[:7] in table


def test_results_are_saved_under_the_date_and_model(tmp_path: Path):
    path = S.save_results(tmp_path, "2026-10-03", {"model": "qwen3.8-flash:free", "totals": {"judged": 1}})
    assert path.parent.name == "2026-10-03" and path.suffix == ".json"
    assert path.name == "qwen3_8_flash_free.json"
    saved = json.loads(path.read_text())
    assert saved["date"] == "2026-10-03" and saved["model"] == "qwen3.8-flash:free"


# -- the transcript recorder (locks the ticket-08 formats it reads) ------------
def _submit_msg(call_id: str, prose: str, action: str) -> dict:
    return {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": call_id,
            "type": "function",
            "function": {
                "name": "submit_reply",
                "arguments": json.dumps({"prose": prose, "action_key": action, "cells": []}),
            },
        }],
    }


def test_recorder_reads_the_first_draft_and_its_rejection():
    rec = S.DraftRecorder(None)
    answered = []

    async def inner(messages, tools):
        answered.append(list(messages))
        return {}

    rec.inner = inner
    import asyncio

    cards = [{"id": "kc-t", "title": "T", "numbers": [{"name": "x", "value": 14.1, "unit": "afr"}]}]
    # One call carries the whole transcript so far, as the provider calls do.
    asyncio.run(rec(
        [
            {"role": "user", "content": "Explain this Drive's reply."},
            {"role": "tool", "tool_call_id": "c0", "name": "search_knowledge",
             "content": json.dumps(cards)},
            _submit_msg("c0", "E10 burns at 14.1.", "baseline"),
            {"role": "tool", "tool_call_id": "c0",
             "content": "Rejected by the verify step. Fix these, then call submit_reply again:\n- These numbers are not in any tool result: 14.1."},
        ],
        [],
    ))
    assert rec.first_submit == {"prose": "E10 burns at 14.1.", "action_key": "baseline", "cells": []}
    assert rec.first_rejection == ["These numbers are not in any tool result: 14.1."]
    record = S.first_record(rec, {"verified": False, "repaired": True, "fallback": "unverified"})
    assert record["first_issues"] == rec.first_rejection
    assert record["card_numbers"] == [14.1]
    assert S.classify_issue(record["first_issues"][0], record["card_numbers"]) == "uncited claim"


def test_recorder_falls_back_to_the_reply_issues_with_no_draft():
    rec = S.DraftRecorder(None)
    record = S.first_record(rec, {"verified": False, "fallback": "error", "issues": ["The model call failed: down"]})
    assert record["first_issues"] == ["The model call failed: down"]
    assert record["first_prose"] == ""


# -- config, gate and the clean skip -------------------------------------------
def test_default_models_include_the_ticket_free_model():
    assert "qwen3.8-flash:free" in S.DEFAULT_MODELS


def test_env_example_documents_the_model_list():
    text = (S.ROOT / ".env.example").read_text(encoding="utf-8")
    assert "KTA_LLM_MODELS=" in text


def test_gate_needs_the_env_var(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv(S.SCORECARD_ENV_VAR, raising=False)
    enabled, reason = S.gate()
    assert enabled is False
    assert S.SCORECARD_ENV_VAR in reason and "\n" not in reason
    monkeypatch.setenv(S.SCORECARD_ENV_VAR, "1")
    assert S.gate()[0] is True


def _clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in (S.SCORECARD_ENV_VAR, "KTA_LLM_BASE_URL", "KTA_LLM_API_KEY",
                 "KTA_LLM_MODEL", "KTA_LLM_MODELS"):
        monkeypatch.delenv(name, raising=False)


def test_no_env_skips_with_one_line_reason(monkeypatch: pytest.MonkeyPatch, capsys):
    _clean_env(monkeypatch)
    assert S.main([]) == 0
    out = capsys.readouterr().out.strip()
    assert out.startswith("scorecard skipped:") and "\n" not in out


def test_env_without_key_skips_with_one_line_reason(monkeypatch: pytest.MonkeyPatch, capsys, tmp_path: Path):
    _clean_env(monkeypatch)
    monkeypatch.setenv(S.SCORECARD_ENV_VAR, "1")
    from kta_server.config import Settings

    monkeypatch.setattr(
        "kta_server.config.load_settings",
        lambda: Settings(db_path=tmp_path / "kta.db"),
    )
    assert S.main([]) == 0
    out = capsys.readouterr().out.strip()
    assert out.startswith("scorecard skipped: no LLM key") and "\n" not in out
