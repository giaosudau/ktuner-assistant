"""Knowledge cards (ticket 09): small typed cards the agent retrieves and cites.

Cards live in `knowledge/cards/*.md` (ADR 0004): a strict `key: value`
frontmatter block between `---` lines, then the body in plain words. Each
card carries its source (doc + section) and every digit in its body is a
declared number, so anything the agent quotes from a cited card is checkable.
`docs/research/fact-check.md` wins every number conflict; corrected claims are
kept as `superseded-by <id>` so the agent never repeats them, and a superseded
card is never returned as current.

The generated index is built here from the cards (an inverted keyword map);
`knowledge/index.json` is its committed snapshot. `search_knowledge` serves
the agent tool of the same name: keyword search first, at most 5 cards.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Mapping, Sequence

ROOT = Path(__file__).resolve().parents[2]
CARDS_DIR = ROOT / "knowledge" / "cards"
INDEX_PATH = ROOT / "knowledge" / "index.json"
#: Facts the agent needed and no card held (tuning-shop D8). Never cited until a reviewer approves them.
PROPOSED_DIR = ROOT / "knowledge" / "proposed"

KINDS = ("fact", "rule", "play", "owner-question", "ktuner-howto")

#: At most this many cards serve one `search_knowledge` call.
MAX_HITS = 5

#: A card body stays short enough to quote: plain words, no tables.
MAX_WORDS = 150


class CardError(ValueError):
    """A card with no source, a bad shape, or a number fact-check refutes."""


# ---------------------------------------------------------------------------
# Frontmatter: strict `key: value` lines, one `numbers:` list of
# `- name: value unit`. No YAML dependency on purpose: the shape is fixed and
# the parser failing loudly is the build gate.
# ---------------------------------------------------------------------------
_NUMBER_LINE = re.compile(r"^-\s*([A-Za-z0-9_.-]+)\s*:\s*([-+]?[0-9]*\.?[0-9]+)\s+(.+?)\s*$")
_KEY_LINE = re.compile(r"^([A-Za-z-]+)\s*:\s*(.*?)\s*$")
_TOKEN = re.compile(r"[^\W_]+", re.UNICODE)


def parse_card(path: Path) -> dict[str, Any]:
    """Read one `knowledge/cards/<id>.md` file into a card dict."""
    text = path.read_text(encoding="utf-8")
    parts = text.split("---")
    if len(parts) < 3 or not parts[0].strip() == "":
        raise CardError(f"{path.name}: expected a frontmatter block between --- lines")
    front, body = parts[1], "---".join(parts[2:]).strip()
    fields: dict[str, str] = {}
    numbers: list[dict[str, Any]] = []
    in_numbers = False
    for line in front.splitlines():
        if not line.strip():
            continue
        if _KEY_LINE.match(line) and line.split(":", 1)[0].strip() == "numbers" and not line.split(":", 1)[1].strip():
            in_numbers = True
            continue
        if in_numbers and line.lstrip().startswith("-"):
            match = _NUMBER_LINE.match(line.strip())
            if not match:
                raise CardError(f"{path.name}: bad number line: {line.strip()!r}")
            name, raw, unit = match.groups()
            numbers.append({"name": name, "value": float(raw), "unit": unit})
            continue
        match = _KEY_LINE.match(line)
        if not match:
            raise CardError(f"{path.name}: bad frontmatter line: {line.strip()!r}")
        in_numbers = False
        fields[match.group(1)] = match.group(2)
    card = {
        "id": fields.get("id", ""),
        "title": fields.get("title", ""),
        "kind": fields.get("kind", ""),
        "topics": [t.strip().lower() for t in fields.get("topics", "").split(",") if t.strip()],
        "applies-when": fields.get("applies-when", ""),
        "numbers": numbers,
        "source": {"doc": fields.get("source-doc", ""), "section": fields.get("source-section", "")},
        "status": fields.get("status", ""),
        "body": body,
    }
    if card["id"] and path.stem != card["id"]:
        raise CardError(f"{path.name}: file name does not match id {card['id']!r}")
    return card


def check_numbers(
    cards: Sequence[Mapping[str, Any]], pinned: Mapping[str, Any]
) -> list[str]:
    """Numbers of current cards conflicting with the fact-check table.

    Returns issue strings (empty when clean). Superseded cards are skipped:
    keeping refuted claims is their job.
    """
    issues: list[str] = []
    for card in cards:
        if card.get("status") != "current":
            continue
        for number in card.get("numbers") or []:
            name = str(number.get("name"))
            if name not in pinned:
                continue
            want = pinned[name]
            if float(number.get("value")) != float(want["value"]) or str(number.get("unit")) != str(want["unit"]):
                issues.append(
                    f"{card.get('id')}: {name} = {number.get('value')} {number.get('unit')}, "
                    f"but fact-check.md {want['section']} pins {want['value']} {want['unit']}"
                )
    return issues


def validate_cards(cards: Sequence[Mapping[str, Any]], pinned: Mapping[str, Any] | None = None) -> None:
    """Fail the build on a sourceless card or a number fact-check refutes.

    `pinned` is the fact-check table (`{name: {value, unit, section}}`); only
    current cards are checked against it — superseded cards keep refuted
    claims on purpose. Number names a card does not share with the table are
    card-local claims from the card's own source and pass untouched.
    """
    by_id = {str(c.get("id")): c for c in cards}
    for card in cards:
        cid = str(card.get("id") or "")
        if not cid:
            raise CardError("a card with no id")
        if not str(card.get("title") or "").strip():
            raise CardError(f"{cid}: no title")
        if card.get("kind") not in KINDS:
            raise CardError(f"{cid}: kind must be one of {', '.join(KINDS)}")
        if not card.get("topics"):
            raise CardError(f"{cid}: no topics")
        if not str(card.get("applies-when") or "").strip():
            raise CardError(f"{cid}: no applies-when")
        source = card.get("source") or {}
        doc, section = str(source.get("doc") or ""), str(source.get("section") or "")
        if not doc or not section:
            raise CardError(f"{cid}: a card with no source fails")
        if not (ROOT / doc).exists():
            raise CardError(f"{cid}: source doc does not exist: {doc}")
        status = str(card.get("status") or "")
        if status == "current":
            pass
        elif status.startswith("superseded-by "):
            target = status.replace("superseded-by", "").strip()
            pointed = by_id.get(target)
            if pointed is None or pointed.get("status") != "current":
                raise CardError(f"{cid}: superseded-by points nowhere current: {target!r}")
        else:
            raise CardError(f"{cid}: status must be current or 'superseded-by <id>'")
        words = str(card.get("body") or "").split()
        if not words or len(words) > MAX_WORDS:
            raise CardError(f"{cid}: body must be 1-{MAX_WORDS} words, has {len(words)}")
        names = [str(n.get("name")) for n in card.get("numbers") or []]
        if len(set(names)) != len(names):
            raise CardError(f"{cid}: duplicate number names")
    if pinned:
        issues = check_numbers(cards, pinned)
        if issues:
            raise CardError("; ".join(issues))


def load_cards(directory: Path | None = None) -> list[dict[str, Any]]:
    """Parse every card and validate its shape. Raises on the first bad card."""
    where = directory or CARDS_DIR
    if not where.exists():
        raise CardError(f"no cards directory: {where}")
    cards = [parse_card(path) for path in sorted(where.glob("*.md"))]
    if not cards:
        raise CardError(f"no cards in {where}")
    validate_cards(cards)
    return cards


def current_cards(cards: Sequence[Mapping[str, Any]] | None = None) -> list[dict[str, Any]]:
    """Only current cards: superseded ones are never returned as current."""
    return [c for c in (cards if cards is not None else load_cards()) if c.get("status") == "current"]


def get(card_id: str, cards: Sequence[Mapping[str, Any]] | None = None) -> dict[str, Any] | None:
    for card in current_cards(cards):
        if card["id"] == card_id:
            return card
    return None


# ---------------------------------------------------------------------------
# The generated index: an inverted keyword map over the current cards, plus
# the card payloads. `search` scores title above topics above body — keyword
# search first, no embeddings, deterministic.
# ---------------------------------------------------------------------------
def _text_of(card: Mapping[str, Any]) -> dict[str, str]:
    return {
        "title": f"{card.get('id', '')} {card.get('title', '')}".lower(),
        "topics": " ".join(card.get("topics") or []).lower(),
        "body": f"{card.get('body', '')} {card.get('applies-when', '')}".lower(),
    }


def build_index(cards: Sequence[Mapping[str, Any]] | None = None) -> dict[str, Any]:
    current = current_cards(cards)
    postings: dict[str, list[str]] = {}
    for card in current:
        tokens = set(_TOKEN.findall(" ".join(_text_of(card).values())))
        for token in tokens:
            postings.setdefault(token, []).append(card["id"])
    return {
        "cards": [
            {
                "id": c["id"],
                "title": c["title"],
                "kind": c["kind"],
                "topics": list(c["topics"]),
                "applies-when": c["applies-when"],
                "numbers": [dict(n) for n in c["numbers"]],
                "source": dict(c["source"]),
                "status": c["status"],
                "body": c["body"],
            }
            for c in current
        ],
        "postings": {token: sorted(ids) for token, ids in sorted(postings.items())},
    }


def search(
    query: str,
    topics: Sequence[str] | None = None,
    kind: str | None = None,
    cards: Sequence[Mapping[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """At most MAX_HITS current cards for a keyword query, best first."""
    pool = current_cards(cards)
    if kind:
        pool = [c for c in pool if c["kind"] == kind]
    if topics:
        wanted = {t.strip().lower() for t in topics if t.strip()}
        pool = [c for c in pool if wanted & set(c.get("topics") or [])]
    tokens = [t.lower() for t in _TOKEN.findall(query or "")]
    if not tokens:
        return pool[:MAX_HITS]
    scored: list[tuple[int, dict[str, Any]]] = []
    for card in pool:
        text = _text_of(card)
        score = sum(
            3 * text["title"].count(token) + 2 * text["topics"].count(token) + text["body"].count(token)
            for token in tokens
        )
        if score > 0:
            scored.append((score, card))
    scored.sort(key=lambda item: (-item[0], item[1]["id"]))
    return [card for _, card in scored[:MAX_HITS]]


def card_numbers(cards: Sequence[Mapping[str, Any]]) -> list[float]:
    """Every quotable number of the given cards, for the verify allowlist."""
    out: list[float] = []
    for card in cards or []:
        for number in card.get("numbers") or []:
            try:
                out.append(float(number.get("value")))
            except (TypeError, ValueError):
                continue
    return out


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60] or "fact"


def propose(title: str, claim: str, why: str, source_hint: str = "") -> dict[str, Any]:
    """Record a fact the agent needed but no card holds. It is not citable until `approve` turns it into a card.

    The proposal keeps the agent honest: it says "I've noted it to check" instead of asserting an
    unsourced fact, and the knowledge base grows from real owner questions.
    """
    title, claim = title.strip(), claim.strip()
    if not title or not claim:
        return {"ok": False, "error": "A proposal needs a title and a claim."}
    PROPOSED_DIR.mkdir(parents=True, exist_ok=True)
    pid = "kp-" + _slug(title)
    path = PROPOSED_DIR / f"{pid}.md"
    if path.exists():
        return {"ok": True, "id": pid, "status": "already proposed, awaiting review"}
    path.write_text(
        "---\n"
        f"id: {pid}\ntitle: {title}\nstatus: proposed\nwhy: {why.strip()}\nsource-hint: {source_hint.strip() or 'none given'}\n"
        "---\n" + claim + "\n",
        encoding="utf-8",
    )
    return {"ok": True, "id": pid, "status": "proposed, awaiting review; not citable yet"}


def proposals() -> list[dict[str, str]]:
    """Every proposal awaiting review."""
    out = []
    for path in sorted(PROPOSED_DIR.glob("kp-*.md")) if PROPOSED_DIR.exists() else []:
        head = path.read_text(encoding="utf-8").split("---")[1]
        meta = dict(line.split(": ", 1) for line in head.strip().splitlines() if ": " in line)
        out.append({"id": meta.get("id", path.stem), "title": meta.get("title", ""), "why": meta.get("why", ""), "path": str(path)})
    return out


__all__ = ["CARDS_DIR", "PROPOSED_DIR", "CardError", "propose", "proposals", "MAX_HITS", "build_index", "card_numbers", "check_numbers", "current_cards", "get", "load_cards", "parse_card", "search", "validate_cards"]


if __name__ == "__main__":
    if "--proposals" in sys.argv:
        # Review loop: read each proposal, source it, then write it as a card in knowledge/cards/
        # (with source-doc and source-section) and delete the proposal; the build checks it.
        for item in proposals():
            print(f"{item['id']}: {item['title']}  (why: {item['why']})  {item['path']}")
        if not proposals():
            print("no proposals awaiting review")
    elif "--dump-index" in sys.argv:
        INDEX_PATH.write_text(json.dumps(build_index(load_cards()), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"wrote {INDEX_PATH}")
    else:
        load_cards()
        print(f"{len(current_cards())} current cards validate")
