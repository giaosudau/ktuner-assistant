"""Seam 1: the Calibration result card and the map tour's boost reason (calibration drive C10).

Four lines after the Health report, each with its own numbers: the Pedal, the Logger, the Ceiling
read and what it means for the map. The map tour's boost row quotes the same reason, and the
explainer may quote the card's numbers because they are tool numbers.
"""

from __future__ import annotations

import pytest

from conftest import Loop, owner_csv

from test_car_profile import CENSUS, confirm, draft

from kta_server import agent as AG
from kta_server import copy as C
from kta_server import tour as TOUR

SUMMARY = {"pedalFullPct": 94, "flooredPct": 84.6}
PROFILE = {**CENSUS, "pedal_full_pct": 94}
CAPPED = {"status": "capped", "settled": True, "driveId": "20260901-081358", "mapAction": "no-change",
          "target": 19.2, "cell": 21.0, "rpm": 4000, "cmd": 100, "ewg": 3}
#: One engine result per C7 row, with the numbers each carries.
READS = {
    "none": {},
    "no-reading": {"text": "was read without a Pedal full reading: say what TPS reads with the pedal floored"},
    "pedal-wrong": {"text": "logged the pedal at 97 %, above your Pedal full reading of 94 %: read it again"},
    "slow-log": {"text": "was logged 5 times a second, under 6: a 0.5 s overshoot can't be read"},
    "not-floored": {"floored": 84.6},
    "cut": {},
    "throttle": {"cmd": 90},
    "turbo": {"under": 2.1, "ewg": 0.5},
    "ramping": {"rise": 0.8},
    "capped": CAPPED,
    "reaches": {**CAPPED, "target": 20.8},
}


def card_for(status: str, summary=SUMMARY, profile=PROFILE, rate=7.5) -> dict:
    cal = {**READS[status], "status": status, "mapAction": "boost-step-gates" if status == "reaches" else "no-change"}
    return C.calibration_card(cal, summary, profile, rate)


@pytest.mark.parametrize("status", list(READS))
def test_every_ceiling_result_renders_its_four_lines(status):
    card = card_for(status)
    assert [line["label"] for line in card["lines"]] == ["Pedal", "Logger", "Ceiling", "What it means"]
    assert all(line["value"] for line in card["lines"])
    meaning = card["lines"][3]["value"]
    assert meaning.startswith("Boost step") if status == "reaches" else meaning.startswith("No map change"), meaning
    assert card["meaning"] in meaning


def test_the_lines_carry_their_own_numbers():
    card = card_for("capped")
    pedal, logger, ceiling, meaning = (line["value"] for line in card["lines"])
    assert pedal == "Full reads 94 %, floored from 84.6 %"
    assert logger == "7.5 a second · AFR Command not offered · MAF Hz not offered"
    assert ceiling == "Capped below the table: target 19.2 psi against the table's 21.0 psi at 4,000 rpm · TPS Command 100 % · EWG 3 %"
    assert "a raised cell would never show in the log" in meaning and "different basemap" in card["unlocks"]
    assert card_for("reaches")["lines"][3]["value"] == "Boost step: the gates are next."
    assert "84.6 % or more" in card_for("not-floored")["lines"][2]["value"]
    assert "TPS Command held at 90 %" in card_for("throttle")["lines"][2]["value"]
    # No reading yet: the Pedal line says so, and the Ceiling line uses the engine's own words.
    none = C.calibration_card({"status": "no-reading", **READS["no-reading"]}, {}, {}, 10)
    assert none["lines"][0]["value"].startswith("Not set yet")
    assert none["lines"][1]["value"] == "10 a second · AFR Command not checked · MAF Hz not checked"
    assert "without a Pedal full reading" in none["lines"][2]["value"]


def test_the_map_tours_boost_row_quotes_the_same_reason():
    card = card_for("capped")
    boost = next(f for f in TOUR.map_tour({}, {}, card)["families"] if f["family"] == "boost")
    assert (boost["status"], boost["reason"], boost["unlocks"]) == ("locked", card["meaning"], card["unlocks"])
    # Reaches: the Boost step gates speak, as before.
    plain = next(f for f in TOUR.map_tour({}, {})["families"] if f["family"] == "boost")
    reach = next(f for f in TOUR.map_tour({}, {}, card_for("reaches"))["families"] if f["family"] == "boost")
    assert reach == plain


def test_the_explainer_may_quote_the_cards_numbers():
    facts = AG.seed_facts({"summary": {}}, {"calibration": card_for("capped")}, {})
    assert 19.2 in facts and 21.0 in facts and 4000 in facts


def test_a_drive_reply_carries_the_card_and_the_tour_quotes_it(tmp_path):
    """Profile → upload → worker `carCalibration` → reply: the card after the Health report, the tour's boost row."""
    loop = Loop(tmp_path).start()
    try:
        confirm(loop, {**draft(loop)["fields"], **PROFILE})
        reply = loop.send(loop.upload(owner_csv("sep01-0813"), "TunerView_20260901_081358.csv"))
        assert not reply.errors(), reply.errors()
        card = reply.card["calibration"]
        assert [line["label"] for line in card["lines"]] == ["Pedal", "Logger", "Ceiling", "What it means"]
        assert card["lines"][0]["value"] == "Full reads 94 %, floored from 84.6 %"
        boost = next(f for f in reply.card["tour"]["families"] if f["family"] == "boost")
        if card["status"] != "reaches":
            assert boost["reason"] == card["meaning"]
    finally:
        loop.close()
