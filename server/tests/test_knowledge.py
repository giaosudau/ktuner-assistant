"""Knowledge cards and citations (ticket 09): the build-time gate.

Cards live in `knowledge/cards/*.md` (ADR 0004); `kta_server/knowledge.py`
parses, validates and searches them. This module fails the build when a card
has no source or a number conflicts with `docs/research/fact-check.md`.

`fact-check.md` has no machine-readable table, so its load-bearing numbers are
hand-encoded below as PINNED, each with its `fact-check.md` section. The rule
is: fact-check wins — if a research doc disagrees, the card follows fact-check
and the conflict is noted as superseded or as a PM note. If fact-check itself
changes, this table must be re-encoded by hand; `test_pinned_sections_exist`
guards the section refs, not the values.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from kta_server import knowledge as K
from kta_server import verify as V

REPO = Path(__file__).resolve().parents[2]
FACT_CHECK = REPO / "docs" / "research" / "fact-check.md"

# (name, value, unit, fact-check section). Names are the canonical names cards
# must reuse for these concepts; units must match literally.
PINNED: list[tuple[str, float, str, str]] = [
    # §1 E10 and fuel
    ("gasoline-stoich", 14.7, "AFR", "§1"),
    ("ethanol-stoich", 9.0, "AFR", "§1"),
    ("e10-stoich", 14.1, "AFR", "§1"),
    ("e10-extra-fuel", 4.3, "%", "§1"),
    ("e10-less-energy", 3.4, "%", "§1"),
    ("wot-lambda-lo", 0.69, "lambda", "§1"),
    ("wot-lambda-hi", 0.73, "lambda", "§1"),
    ("wot-lambda-target", 0.75, "lambda", "§1"),
    ("cruise-trim-median", -0.8, "%", "§1"),
    ("cruise-trim-p10", -3.1, "%", "§1"),
    ("cruise-trim-p90", 1.6, "%", "§1"),
    ("vn95-us-aki", 91.0, "AKI", "§1"),
    # §2 Fuel-quality score (Knock Control)
    ("kc-floor", 0.49, "score", "§2"),
    ("kc-watch", 0.56, "score", "§2"),
    ("kc-nohard", 0.62, "score", "§2"),
    ("kc-nohard-hold", 60.0, "s", "§2"),
    ("kc-stop", 0.80, "score", "§2"),
    ("kc-table-boost", 10.2, "°", "§2"),
    ("cost-at-056", 0.7, "°", "§2"),
    ("cost-at-062", 1.3, "°", "§2"),
    ("cost-score-065", 0.65, "score", "§2"),
    ("cost-at-065", 1.6, "°", "§2"),
    ("cost-at-080", 3.2, "°", "§2"),
    ("retard-at-floor", 5.0, "°", "§2"),
    ("cool-end-lo", 0.49, "score", "§2"),
    ("cool-end-hi", 0.53, "score", "§2"),
    ("hot-peak-max", 0.66, "score", "§2"),
    ("lugging-lo", 900.0, "rpm", "§2"),
    ("lugging-hi", 1700.0, "rpm", "§2"),
    ("rises-lugging", 31.0, "count", "§2"),
    ("rises-total", 41.0, "count", "§2"),
    # §3 CVT
    ("stock-torque", 240.0, "Nm", "§3"),
    ("stock-power", 176.0, "hp", "§3"),
    ("starter21-added-lbft", 58.0, "lb-ft", "§3"),
    ("starter21-added-nm", 79.0, "Nm", "§3"),
    ("cvt-fluid-watch", 90.0, "°C", "§3"),
    ("cvt-fluid-stop", 100.0, "°C", "§3"),
    ("cvt-peak", 95.0, "°C", "§3"),
    ("slip-events", 0.0, "count", "§3"),
    # §4 Turbo, boost, heat
    ("eco-psi", 18.0, "psi", "§4"),
    ("normal-psi", 21.0, "psi", "§4"),
    ("final-target-top", 23.4, "psi", "§4"),
    ("ewg-idle", 8.0, "%", "§4"),
    ("ewg-max", 65.5, "%", "§4"),
    ("ewg-at-boost", 2.5, "%", "§4"),
    ("ic-added-lo", 2.0, "°C", "§4"),
    ("ic-added-hi", 6.0, "°C", "§4"),
    ("pull-iat-good", 48.0, "°C", "§4"),
    ("cool-moving-lo", 35.0, "°C", "§4"),
    ("cool-moving-hi", 39.0, "°C", "§4"),
    ("hot-restart-lo", 57.0, "°C", "§4"),
    ("hot-restart-hi", 64.0, "°C", "§4"),
    # §5 Engine care
    ("lspi-lo", 1500.0, "rpm", "§5"),
    ("lspi-hi", 2500.0, "rpm", "§5"),
    ("seq9-avg-max", 5.0, "events", "§5"),
    ("seq9-iter-max", 8.0, "events", "§5"),
    # §6 Air measurement and mixture
    ("trim-ok", 5.0, "%", "§6"),
    ("trim-stop", 10.0, "%", "§6"),
    ("fault-trim-median", -28.0, "%", "§6"),
    ("map-target-afr", 11.0, "AFR", "§6"),
    ("map-target-lambda", 0.75, "lambda", "§6"),
    ("mix-watch", 0.5, "AFR", "§6"),
    ("mix-stop", 1.0, "AFR", "§6"),
    ("mixture-rule-psi", 12.0, "psi", "§6"),
    ("boosted-readings-max", 11.3, "AFR", "§6"),
]


def pinned_map() -> dict[str, dict[str, object]]:
    return {name: {"value": value, "unit": unit, "section": section} for name, value, unit, section in PINNED}


# -- the cards themselves ----------------------------------------------------
def test_cards_parse_and_validate():
    cards = K.load_cards()
    current = [c for c in cards if c["status"] == "current"]
    assert len(current) >= 14, f"only {len(current)} current cards"
    assert len({c["id"] for c in cards}) == len(cards), "card ids must be unique"


def test_pinned_sections_exist_in_fact_check():
    text = FACT_CHECK.read_text(encoding="utf-8")
    for _, _, _, section in PINNED:
        number = section.lstrip("§")
        assert f"## {number}." in text, f"{section} is not a section of fact-check.md"


def test_card_numbers_match_fact_check():
    issues = K.check_numbers(K.load_cards(), pinned_map())
    assert issues == [], "numbers conflicting with fact-check.md:\n" + "\n".join(issues)


def test_every_pinned_number_is_used_by_a_card():
    used = {n["name"] for c in K.load_cards() if c["status"] == "current" for n in c["numbers"]}
    missing = [name for name, _, _, _ in PINNED if name not in used]
    assert missing == [], f"pinned numbers no current card carries: {missing}"


def test_every_digit_in_a_body_is_a_declared_number():
    """The agent may only quote a cited card's numbers, so a body digit the
    card does not declare is a number the agent can never say. Small counts
    are written as words ("ten minutes"); E10/RON95/1.5T ride on FREE."""
    bad: list[str] = []
    for card in K.load_cards():
        if card["status"] != "current":
            continue
        declared = [float(n["value"]) for n in card["numbers"]]
        for value in V.numbers_in(card["body"]):
            if V.number_allowed(value, declared):
                continue
            bad.append(f"{card['id']}: {value:g} not declared and not FREE")
    assert bad == [], "body digits no number entry covers:\n" + "\n".join(bad)


def test_bodies_are_short_plain_words():
    for card in K.load_cards():
        words = card["body"].split()
        assert 1 <= len(words) <= 150, f"{card['id']}: {len(words)} words"
        assert "|" not in card["body"], f"{card['id']}: no tables in a card body"
        assert not any(line.lstrip().startswith("#") for line in card["body"].splitlines()), (
            f"{card['id']}: no headings in a card body"
        )


# -- build failures: no source, conflicting number -----------------------------
def _card(**over: object) -> dict:
    base: dict = {
        "id": "kc-probe",
        "title": "Probe",
        "kind": "fact",
        "topics": ["knock"],
        "applies-when": "testing",
        "numbers": [],
        "source": {"doc": "docs/research/fact-check.md", "section": "§2"},
        "status": "current",
        "body": "A probe card with no digits.",
    }
    base.update(over)
    return base


def test_a_card_with_no_source_fails():
    with pytest.raises(K.CardError):
        K.validate_cards([_card(source={"doc": "", "section": ""})])
    with pytest.raises(K.CardError):
        K.validate_cards([_card(source={"doc": "docs/research/no-such-doc.md", "section": "§9"})])


def test_a_number_conflicting_with_fact_check_fails():
    card = _card(numbers=[{"name": "kc-floor", "value": 0.50, "unit": "score"}])
    with pytest.raises(K.CardError, match="§2"):
        K.validate_cards([card], pinned=pinned_map())


def test_a_wrong_unit_conflicting_with_fact_check_fails():
    card = _card(numbers=[{"name": "kc-floor", "value": 0.49, "unit": "psi"}])
    with pytest.raises(K.CardError):
        K.validate_cards([card], pinned=pinned_map())


def test_superseded_cards_keep_refuted_numbers_without_failing():
    card = _card(
        id="kc-old",
        status="superseded-by kc-probe",
        numbers=[{"name": "kc-floor", "value": 0.99, "unit": "score"}],
    )
    probe = _card()
    # Refuted numbers are the point of a superseded card: never checked.
    K.validate_cards([card, probe], pinned=pinned_map())


def test_superseded_must_point_at_a_current_card():
    with pytest.raises(K.CardError, match="superseded"):
        K.validate_cards([_card(id="kc-old", status="superseded-by kc-missing")])


# -- coverage: every ticket topic has a card -----------------------------------
COVERAGE = {
    "knock ranges and timing cost": "kc-ranges",
    "after-flash pattern": "kc-after-flash",
    "rises above 5,200 rpm": "kc-high-rpm",
    "rich WOT on E10": "kc-rich-wot",
    "heat soak": "kc-heat-soak",
    "trims normal": "kc-trims",
    "trim leak or mismatch": "kc-trim-cause",
    "MAF Scaling per housing": "kc-maf-housing",
    "P0420 and đăng kiểm": "kc-p0420",
    "CVT care": "kc-cvt",
    "expectation lines (no headroom)": "kc-expectations",
}


def test_ticket_topics_are_covered():
    by_id = {c["id"]: c for c in K.load_cards()}
    missing = [f"{topic} ({cid})" for topic, cid in COVERAGE.items() if by_id.get(cid, {}).get("status") != "current"]
    assert missing == [], f"ticket topics with no current card: {missing}"


def test_superseded_cards_are_never_returned_as_current():
    cards = K.load_cards()
    superseded = [c for c in cards if c["status"] != "current"]
    assert len(superseded) >= 4, "corrected claims must be kept as superseded"
    by_id = {c["id"]: c for c in cards}
    for card in superseded:
        target = card["status"].replace("superseded-by", "").strip()
        assert by_id.get(target, {}).get("status") == "current", f"{card['id']} points nowhere current"
    # Even a query matching a superseded claim returns only current cards.
    for query in ["factory curve", "250 Nm", "0.70 knock", "E10 trim baseline", "21 psi no margin"]:
        for hit in K.search(query):
            assert hit["status"] == "current", f"superseded {hit['id']} returned for {query!r}"


# -- the generated index and search ----------------------------------------------
def test_search_returns_at_most_five_keyword_first():
    assert len(K.search("knock control timing fuel heat boost mixture")) <= 5
    assert K.search("knock control timing cost")[0]["id"] == "kc-ranges"
    assert K.search("P0420 inspection")[0]["id"] == "kc-p0420"
    assert K.search("heat soak intake hot")[0]["id"] == "kc-heat-soak"
    assert K.search("MAF housing intake")[0]["id"] == "kc-maf-housing"


def test_search_filters_by_topic_and_kind():
    assert {c["id"] for c in K.search("", topics=["cvt"])} == {"kc-cvt"}
    kinds = {c["kind"] for c in K.search("", kind="ktuner-howto")}
    assert kinds == {"ktuner-howto"}
    assert all(c["kind"] == "ktuner-howto" for c in K.search("intake", kind="ktuner-howto"))


def test_generated_index_is_in_sync():
    path = REPO / "knowledge" / "index.json"
    assert path.exists(), "run: python3 -m kta_server.knowledge --dump-index"
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert saved == K.build_index(K.load_cards()), "stale knowledge/index.json; re-run --dump-index"


# -- verify: citations for claims not from the drive -----------------------------
FACTS = [0.49, 0.65, 1.6, 53.0, 11.0, 12.0, 42.0, 48.0, 5.0]

RANGES = {"id": "kc-ranges", "title": "t", "numbers": [{"name": "kc-table-boost", "value": 10.2, "unit": "°"}]}


def test_a_cited_card_number_passes():
    ok = V.verify(
        "Knock Control 0.65 is scheduled from the 10.2 degree table. [kc-ranges]",
        "baseline", "baseline", FACTS, None, [], knowledge=[RANGES],
    )
    assert ok["ok"] is True, ok["issues"]


def test_an_uncited_card_number_fails_naming_the_card():
    bad = V.verify(
        "Knock Control 0.65 is scheduled from the 10.2 degree table.",
        "baseline", "baseline", FACTS, None, [], knowledge=[RANGES],
    )
    assert bad["ok"] is False
    assert "card" in bad["issues"][0].lower()


def test_citing_an_unknown_card_fails():
    bad = V.verify(
        "Knock Control 0.65 is scheduled from the 10.2 degree table. [kc-nope]",
        "baseline", "baseline", FACTS, None, [], knowledge=[RANGES],
    )
    assert bad["ok"] is False
    assert "kc-nope" in bad["issues"][0]


def test_without_knowledge_nothing_changes():
    assert V.verify("Knock Control peaked at 0.65.", "baseline", "baseline", FACTS, None, [])["ok"] is True
    assert V.verify("Knock Control peaked at 0.83.", "baseline", "baseline", FACTS, None, [])["ok"] is False


def test_citation_ids_are_bracketed_card_ids():
    assert V.citation_ids("Heat soak explains it. [kc-heat-soak] See [kc-cvt].") == {"kc-heat-soak", "kc-cvt"}
    assert V.citation_ids("A list [1] is not a card.") == set()
