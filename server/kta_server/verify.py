"""Deterministic verify for the LLM agent (ticket 08): no LLM, no network.

Every number the reply states must match a tool result (rounding is fine, new
arithmetic is not); the action named must be the decided Next step; every
table, cell and value must match the Flash plan; banned advice is rejected in
English and Vietnamese (the app ships both languages, so the check reads both).

One failed reply gets one repair turn; a second failure falls back to the
built-in reply (`agent.py`). This module only judges; it never calls anything.

The number rules mirror the in-browser ask module (`engine/kta-ask.js`):
facts are every number any tool returned in this run, `FREE` car constants any
owner may say, and rounding (integer, 1-2 decimals, tens/hundreds for large
readings) is allowed. Differences, sums, averages and percentages of the
model's own are not.
"""

from __future__ import annotations

import re
from typing import Any, Mapping, Sequence

from .knowledge import card_numbers as _card_numbers

#: Numbers any owner may say: the car (1.5 litre, RON 95/92, E10, 14.7 stoich).
FREE = (1.5, 14.7, 95.0, 92.0, 10.0)

_LIST_MARKER = re.compile(r"^\s*\d+[.)]\s", re.MULTILINE)
_NUMBER = re.compile(
    r"(?<![A-Za-z0-9_.])"  # not part of a word, a version or a decimal
    r"([-+\u2212]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-+\u2212]?\d+(?:\.\d+)?)"
    r"(?![A-Za-z]*\d)"
)


def numbers_in(text: str) -> list[float]:
    """Every number in a prose string, in order. List markers are not numbers."""
    cleaned = _LIST_MARKER.sub(" ", str(text))
    out: list[float] = []
    for match in _NUMBER.finditer(cleaned):
        raw = match.group(1).replace(",", "").replace("\u2212", "-")
        try:
            value = float(raw)
        except ValueError:  # pragma: no cover - the regex only matches digits
            continue
        if value == value and value not in (float("inf"), float("-inf")):
            out.append(value)
    return out


def collect_numbers(value: Any, into: list[float] | None = None) -> list[float]:
    """Every number in a tool result (dicts, lists, strings), in order."""
    into = into if into is not None else []
    if value is None:
        return into
    if isinstance(value, bool):
        return into
    if isinstance(value, (int, float)):
        into.append(float(value))
        return into
    if isinstance(value, str):
        into.extend(numbers_in(value))
        return into
    if isinstance(value, (list, tuple)):
        for item in value:
            collect_numbers(item, into)
        return into
    if isinstance(value, Mapping):
        for item in value.values():
            collect_numbers(item, into)
        return into
    return into


def _near(x: float, fact: float) -> bool:
    if abs(x - fact) < 1e-9:
        return True
    candidates = [round(fact), round(fact, 1), round(fact, 2)]
    if abs(fact) >= 100:
        candidates.append(round(fact / 10) * 10)
    if abs(fact) >= 1000:
        candidates.append(round(fact / 100) * 100)
    return any(abs(candidate - x) < 1e-9 for candidate in candidates)


def number_allowed(x: float, facts: Sequence[float]) -> bool:
    """A quoted number is allowed when some tool returned it (rounding is fine)."""
    for fact in facts:
        if _near(x, fact) or _near(-x, fact):
            return True
    return any(abs(x - free) < 1e-9 for free in FREE)


# ---------------------------------------------------------------------------
# Banned advice. English and Vietnamese: the app ships both, so the check reads
# both. A negation in the words before ("never lower the knock sensitivity" /
# "không giảm độ nhạy kích nổ") is an explanation, not advice, and stays allowed.
# ---------------------------------------------------------------------------
_NEG = re.compile(
    r"(don'?t|do not|never|not|no|avoid|without|isn'?t|"
    r"kh\xf4ng|\u0111\u1eebng|ch\u01b0a|tr\xe1nh|ch\u1edb)"
    r"([^\w]+[\w]+){0,4}[^\w]*$",
    re.IGNORECASE | re.UNICODE,
)

# Edits the app never makes, phrased as edits (ported from engine/kta-ask.js, so
# the server refuses exactly what the browser assistant refuses). Explanations
# such as "a lower Knock Control gives more timing" stay allowed.
_BANNED_BASE = [
    (
        "knockSens",
        re.compile(
            r"(lower|reduce|decrease|desensiti[sz]e|turn down|disable|turn off|remove|unplug)"
            r"([^\w]+[\w]+){0,2}[^\w]+knock[^\w]*(sensor|sensitivity|detection)"
            r"|knock[^\w]*(sensor[^\w]*)?sensitivity([^\w]+[\w]+){0,2}[^\w]+(down|lower|reduce)"
            r"|(gi\u1ea3m|t\u1eaft|b\u1ecf)([^\w]+[\w]+)*[^\w]+\u0111\u1ed9 nh\u1ea1y([^\w]+[\w]+){0,2}[^\w]+k\xedch n\u1ed5"
            r"|(t\u1eaft|b\u1ecf|r\xfat)([^\w]+[\w]+)*[^\w]+c\u1ea3m bi\u1ebfn([^\w]+[\w]+)*[^\w]+k\xedch n\u1ed5",
            re.IGNORECASE | re.UNICODE,
        ),
    ),
    (
        "timing",
        re.compile(
            r"(advance|add|increase|raise)([^\w]+[\w]+){0,3}[^\w]+(ignition|timing|spark)"
            r"([^\w]+[\w]+){0,2}[^\w]+(table|map|cells?\b)"
            r"|(add|advance)[^\w]+\d+(\.\d+)?[^\w]*(\xb0|deg|degrees?)[^\w]+(of[^\w]+)?(ignition|timing)"
            r"|(t\u0103ng|th\xeam)([^\w]+[\w]+){0,2}[^\w]+(g\xf3c[^\w]+)?(\u0111\xe1nh[^\w]+)?l\u1eeda"
            r"([^\w]+[\w]+){0,2}[^\w]+(b\u1ea3ng|map)",
            re.IGNORECASE | re.UNICODE,
        ),
    ),
    (
        "protections",
        re.compile(
            r"(disable|turn off|delete|remove|clear)([^\w]+[\w]+){0,2}[^\w]+"
            r"(check engine|cel\b|mil\b|catalyst|cat\b|o2 sensor|lambda sensor|limp mode|torque protection)"
            r"|(t\u1eaft|x\xf3a|b\u1ecf)([^\w]+[\w]+){0,1}[^\w]+"
            r"(\u0111\xe8n check|c\u1ea3m bi\u1ebfn o2|b\u1ea3o v\u1ec7 m\xf4-men)",
            re.IGNORECASE | re.UNICODE,
        ),
    ),
]

#: A recommendation verb in the words before a boost/curve mention (EN+VI).
#: Quoting a locked lever's title ("Boost +1 psi (24 psi map)") carries no verb
#: and stays quotable; telling the owner to type it is what fails.
_ADVICE_VERB = re.compile(
    r"\b(raise|increase|add|flash|edit|adjust|change|bump|type|put|give|"
    r"t\u0103ng|th\xeam|ch\u1ec9nh|s\u1eeda|\u0111\u1ed5i|n\u1ea1p|flash)\b",
    re.IGNORECASE | re.UNICODE,
)
_BOOST_MENTION = re.compile(r"\bboost\b", re.IGNORECASE | re.UNICODE)
_CURVE_MENTION = re.compile(
    r"(afm|maf)[\W_]*((scaling)[\W_]*)?(curve|\u0111\u01b0\u1eddng cong)"
    r"|(curve|\u0111\u01b0\u1eddng cong)([\W_]*[\w]+){0,2}[\W_]+(afm|maf)",
    re.IGNORECASE | re.UNICODE,
)
#: A boost-adjacent psi reading above the ceiling ("raise boost to 24 psi").
_BOOST_NUMBER = re.compile(r"\bboost\b|\bpsi\b", re.IGNORECASE | re.UNICODE)


def _match_spans(pattern: re.Pattern[str], text: str) -> list[tuple[int, int, str]]:
    return [(m.start(), m.end(), m.group(0)) for m in pattern.finditer(text)]


def _negated(text: str, start: int) -> bool:
    # Only the same sentence counts: the verdict line ("costs … timing, not
    # damage. Lower the knock …") must not launder advice after its full stop.
    window = text[max(0, start - 40):start]
    window = re.split(r"[.!?\u2026\n]+", window)[-1]
    return bool(_NEG.search(window))


def _advised(text: str, start: int) -> bool:
    window = text[max(0, start - 60):start]
    return bool(_ADVICE_VERB.search(window)) and not _negated(text, start)


# ---------------------------------------------------------------------------
# Citations. Claims about this Drive come from tool results; everything else —
# what is normal on this car, what owners report, where things live in KTuner —
# must cite a knowledge card the run read, as a quiet footnote ref [kc-ranges].
# A claim citing neither is rejected, so "based on facts" holds past the tools.
# ---------------------------------------------------------------------------
_CITATION = re.compile(r"\[([a-z0-9]+(?:-[a-z0-9]+)+)\]")


def citation_ids(prose: str) -> set[str]:
    """Card ids the reply cites, e.g. `[kc-ranges]`. List markers (`[1]`) are not cards."""
    return set(_CITATION.findall(str(prose or "")))


def plan_cells(plan: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    if not plan:
        return []
    cells = plan.get("cells") or []
    return [c for c in cells if isinstance(c, Mapping)]


def plan_tables(plan: Mapping[str, Any] | None) -> list[str]:
    if not plan:
        return []
    tables = plan.get("tables") or []
    return [str(t.get("id")) for t in tables if isinstance(t, Mapping) and t.get("id")]


def plan_ceiling_psi(plan: Mapping[str, Any] | None) -> float | None:
    if not plan:
        return None
    ceiling = plan.get("ceilingPsi")
    return float(ceiling) if isinstance(ceiling, (int, float)) else None


def plan_raises_boost(plan: Mapping[str, Any] | None) -> bool:
    """True when the Flash plan itself raises a boost target cell."""
    for cell in plan_cells(plan):
        table = str(cell.get("table") or "")
        before, after = cell.get("before"), cell.get("after")
        if "boost" in table.lower() and isinstance(before, (int, float)) and isinstance(after, (int, float)):
            if after > before:
                return True
    return False


def plan_has_afm_cells(plan: Mapping[str, Any] | None) -> bool:
    """True when the Flash plan itself touches an AFM/MAF table."""
    for cell in plan_cells(plan):
        table = str(cell.get("table") or "").lower()
        if "afm" in table or "maf" in table:
            return True
    return False


def banned_issues(prose: str, plan: Mapping[str, Any] | None = None) -> list[str]:
    """Advice the app never gives, in English and Vietnamese (negation-aware)."""
    issues: list[str] = []
    text = str(prose or "")

    for _rule_id, pattern in _BANNED_BASE:
        for start, _end, matched in _match_spans(pattern, text):
            if not _negated(text, start):
                issues.append(
                    f"The reply suggests {matched.strip()!r}, which this app never "
                    "does for this car. Remove it or say why not to."
                )
                break

    for start, _end, matched in _match_spans(_BOOST_MENTION, text):
        if _advised(text, start) and not plan_raises_boost(plan):
            issues.append(
                f"The reply suggests {matched.strip()!r} as something to change, "
                "which this reply's Flash plan does not raise. Remove it or say why not to."
            )
            break

    ceiling = plan_ceiling_psi(plan)
    if ceiling is not None:
        for match in _NUMBER.finditer(text):
            raw = match.group(1).replace(",", "").replace("\u2212", "-")
            try:
                value = float(raw)
            except ValueError:
                continue
            if value > ceiling:
                window = text[max(0, match.start() - 40):match.end() + 40]
                if _BOOST_NUMBER.search(window):
                    issues.append(
                        f"The reply names {value:g} psi near boost, above the "
                        f"{ceiling:g} psi ceiling this map allows. Stay at or under it."
                    )
                    break

    for start, _end, matched in _match_spans(_CURVE_MENTION, text):
        if _advised(text, start) and not plan_has_afm_cells(plan):
            issues.append(
                f"The reply suggests {matched.strip()!r} as something to edit. "
                "Trims off everywhere route to the MAF Scaling choice or Undo, "
                "never to a curve edit. Remove it or say why not to."
            )
            break

    return issues


def picture_issues(prose: str, pictures: Sequence[Mapping[str, Any]] | None) -> list[str]:
    """A number a picture prints must also be said in the reply (rounding is fine), so no number lives only in a chart."""
    said = numbers_in(prose)
    missing = sorted(
        {
            f"{n:g}"
            for pic in pictures or []
            for n in pic.get("numbers") or []
            if not any(number_allowed(t, [float(n)]) for t in said)
        }
    )
    if not missing:
        return []
    return [
        "The picture shows " + ", ".join(missing[:6]) + " but the reply text does not say "
        + ("it" if len(missing) == 1 else "them")
        + ". Say every number the picture shows, in the text, or do not show the picture."
    ]


def verify(
    prose: str,
    action_key: str | None,
    decided_key: str | None,
    facts: Sequence[float],
    plan: Mapping[str, Any] | None = None,
    cells: Sequence[Mapping[str, Any]] | None = None,
    knowledge: Sequence[Mapping[str, Any]] | None = None,
    pictures: Sequence[Mapping[str, Any]] | None = None,
) -> dict[str, Any]:
    """Judge one draft reply. Returns `{"ok": bool, "issues": [...]}`.

    * every number in `prose` must be in `facts` (rounding is fine);
    * when `knowledge` holds the cards this run read, a number may instead
      come from a cited card's numbers — citing `[id]` — and an unknown `[id]`
      fails;
    * `action_key` must be the decided Next step's key — the agent may not add,
      remove or change the Next step;
    * every submitted cell must match a Flash plan cell exactly;
    * table-like names in `prose` must be tables the Flash plan holds;
    * every number a picture prints (`pictures`) must also be in the text;
    * banned advice (EN+VI) is rejected.
    """
    issues: list[str] = []
    text = str(prose or "")
    if not text.strip():
        issues.append("The reply is empty.")

    cited_numbers: list[float] = []
    if knowledge is not None:
        known = {str(card.get("id")): card for card in knowledge}
        unknown = sorted(citation_ids(text) - set(known))
        if unknown:
            issues.append(
                "The reply cites " + ", ".join(f"[{card_id}]" for card_id in unknown[:4]) + ", "
                "which is not a card this run read. Call search_knowledge and cite one of its ids, "
                "for example [kc-ranges]."
            )
        cited_numbers = _card_numbers([known[card_id] for card_id in citation_ids(text) & set(known)])

    bad = [
        f"{v:g}"
        for v in numbers_in(text)
        if not number_allowed(v, facts) and not number_allowed(v, cited_numbers)
    ]
    if bad:
        hint = (
            "Quote tool numbers exactly (rounding is fine) and do not compute new ones."
            if knowledge is None
            else "Quote tool numbers exactly (rounding is fine) and do not compute new ones. "
            "When a number comes from general knowledge rather than this Drive, "
            "call search_knowledge and cite the card, for example [kc-ranges]."
        )
        issues.append("These numbers are not in any tool result: " + ", ".join(bad[:8]) + ". " + hint)

    if action_key != decided_key:
        issues.append(
            f"The reply names {action_key!r} as the step, but this Drive's decided "
            f"Next step is {decided_key!r}. Name that step and no other."
        )

    have: dict[tuple[Any, Any, Any], Mapping[str, Any]] = {}
    for cell in plan_cells({"cells": list(cells or [])}):
        have[(str(cell.get("table")), cell.get("row", cell.get("rpmRow")), cell.get("col"))] = cell
    for key, cell in have.items():
        match = [c for c in plan_cells(plan) if (str(c.get("table")), c.get("row", c.get("rpmRow")), c.get("col")) == key]
        if not match:
            issues.append(
                f"The reply names a cell not in the Flash plan: {cell.get('table')} "
                f"row {cell.get('row', cell.get('rpmRow'))} col {cell.get('col')}. "
                "Only Flash plan cells may be named."
            )
        else:
            planned = match[0]
            for field in ("before", "after"):
                if cell.get(field) is not None and cell.get(field) != planned.get(field):
                    issues.append(
                        f"The reply's {cell.get('table')} {field} ({cell.get(field)}) "
                        f"is not the Flash plan's ({planned.get(field)}). Quote the plan exactly."
                    )

    for token in sorted(set(re.findall(r"\b[A-Z][A-Za-z0-9_]*_[A-Za-z0-9_]+\b", text))):
        tables = plan_tables(plan)
        if tables and token not in tables and not any(token in t or t in token for t in tables):
            issues.append(
                f"The reply names table {token!r}, which is not in this reply's Flash plan. "
                "Only Flash plan tables may be named."
            )

    issues.extend(picture_issues(text, pictures))
    issues.extend(banned_issues(text, plan))
    return {"ok": not issues, "issues": issues}


__all__ = [
    "FREE",
    "banned_issues",
    "citation_ids",
    "collect_numbers",
    "number_allowed",
    "numbers_in",
    "picture_issues",
    "plan_cells",
    "plan_ceiling_psi",
    "plan_has_afm_cells",
    "plan_raises_boost",
    "plan_tables",
    "verify",
]
