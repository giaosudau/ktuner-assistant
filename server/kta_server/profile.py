"""The Car profile: the owner's one car as the app knows it (CONTEXT.md).

The profile is a typed card — model, engine, transmission, fuel, climate, the
KTuner basemap it started from, and the parts fitted as enums — filled from
the owner's own words, corrected by the owner, and saved only on confirm.
Nothing is saved by drafting: `draft_from_text` is pure.

Two paths share these fields: with a key the chat fills the card from free
text through this same draft shape; with no key the chat shows a plain form
with the same fields (`profile_spec`). The form and the draft validate through
`validate_fields`, so a misread word never becomes a fact about the car.

Editing the parts later records an Install with its date (`installs_for_part
_change`): like a Flash, an Install explains a change in the drives that
follow and starts the drive window (ticket 10).
"""

from __future__ import annotations

import re
from typing import Any

# The parts the app knows, as enums. Only these reach an Install row or the
# drive window; anything else is a 400 that lists these.
PARTS: tuple[str, ...] = ("intake", "downpipe", "front-pipe", "catback", "intercooler", "cvt-cooler")

# How the owner's words map onto the enums. "Exhaust" alone reads as the
# catback (the back box the owner means by it); a front pipe is named as one.
_PART_KEYWORDS: dict[str, tuple[str, ...]] = {
    "intake": ("intake", "hvi", "prl", "airbox", "air filter"),
    "downpipe": ("downpipe", "down pipe", "down-pipe"),
    "front-pipe": ("front pipe", "front-pipe", "frontpipe"),
    "catback": ("catback", "cat-back", "cat back", "exhaust"),
    "intercooler": ("intercooler", "fmic"),
    "cvt-cooler": ("cvt cooler", "cvt-cooler", "transmission cooler"),
}

# The card's fields, in the order the owner reads them. `parts` is the only
# list; the rest are plain strings.
FIELDS: tuple[str, ...] = ("model", "engine", "transmission", "fuel", "climate", "basemap", "parts")

#: Fields the owner must not leave empty on confirm.
REQUIRED: tuple[str, ...] = ("model", "basemap")

_HOT_WORDS = ("hot", "heat", "traffic", "vietnam", "saigon", "hanoi", "humid")


def part_display(part: str) -> str:
    """`front-pipe` → `front pipe`: the enum as the owner reads it."""
    return {"front-pipe": "front pipe", "cvt-cooler": "CVT cooler"}.get(part, part)


def profile_spec(basemap: str) -> dict[str, Any]:
    """The plain form's fields: the same fields the draft fills.

    The chat renders this when there is no key (no LLM to fill the card), so
    the form and the card can never drift apart: both read this spec.
    """
    return {
        "fields": ["model", "engine", "transmission", "fuel", "climate", "basemap"],
        "parts": list(PARTS),
        "basemap": basemap,
        "basemapNote": "Prefilled from the map the app holds: you never type a table name.",
    }


def draft_from_text(text: str, basemap: str) -> dict[str, Any]:
    """Fill the typed card from the owner's own words. Pure: saves nothing.

    Returns `{ fields, filled, missing, prefilled }`: `fields` is the card,
    `filled` says which field came from the text, `missing` lists the empty
    scalar fields the owner still has to say, and `prefilled` names the fields
    the app filled in (the KTuner basemap, always).
    """
    lowered = str(text or "").lower()
    fields: dict[str, Any] = {
        "model": _model(lowered),
        "engine": _engine(lowered),
        "transmission": _transmission(lowered),
        "fuel": _fuel(lowered),
        "climate": _climate(lowered),
        "basemap": basemap,
        "parts": _parts(lowered),
    }
    filled = {
        "model": bool(fields["model"]),
        "engine": bool(fields["engine"]),
        "transmission": bool(fields["transmission"]),
        "fuel": bool(fields["fuel"]),
        "climate": bool(fields["climate"]),
        # The basemap is prefilled, never read: True only when the text names
        # it, so the card can show where the value came from.
        "basemap": bool(re.search(r"starter\s*21|dual\s*tune|basemap", lowered)),
        "parts": bool(fields["parts"]),
    }
    missing = [name for name in FIELDS if name != "parts" and name != "basemap" and not fields[name]]
    return {"fields": fields, "filled": filled, "missing": missing, "prefilled": ["basemap"]}


def _model(lowered: str) -> str:
    match = re.search(r"civic\s+(fe\s+)?1\.5\s*t", lowered)
    if match:
        return "Civic FE 1.5T" if match.group(1) else "Civic 1.5T"
    if "civic" in lowered:
        return "Civic"
    return ""


def _engine(lowered: str) -> str:
    if re.search(r"1\.5\s*t", lowered):
        return "1.5T"
    return ""


def _transmission(lowered: str) -> str:
    if re.search(r"\bcvt\b", lowered):
        return "CVT"
    if re.search(r"\bmanual\b", lowered):
        return "Manual"
    return ""


def _fuel(lowered: str) -> str:
    has_e10 = "e10" in lowered
    match = re.search(r"ron\s*9?5", lowered)
    if has_e10 and match:
        return "E10 RON95"
    if match:
        return "RON95"
    if has_e10:
        return "E10"
    if re.search(r"ron\s*92", lowered):
        return "RON92"
    return ""


def _climate(lowered: str) -> str:
    if any(word in lowered for word in _HOT_WORDS) or re.search(r"3[3-9]|40\s*°?\s*c", lowered):
        return "Hot traffic"
    if re.search(r"\bcool\b|\bmorning\b|dalat", lowered):
        return "Cool mornings"
    return ""


def _parts(lowered: str) -> list[str]:
    found = []
    for part in PARTS:
        if any(key in lowered for key in _PART_KEYWORDS[part]):
            found.append(part)
    return found


def validate_fields(fields: Any, basemap_default: str) -> dict[str, Any]:
    """The card as the owner confirmed it, or raise `ValueError` naming why.

    Both the filled card and the plain form confirm through here, so the same
    card is saved either way. Parts outside the enums never save: the error
    lists the parts the app knows.
    """
    if not isinstance(fields, dict):
        raise ValueError("A Car profile needs its fields.")
    cleaned: dict[str, Any] = {}
    for name in ("model", "engine", "transmission", "fuel", "climate"):
        value = fields.get(name, "")
        cleaned[name] = str(value).strip() if value is not None else ""
    basemap = fields.get("basemap", basemap_default)
    cleaned["basemap"] = str(basemap).strip() if basemap is not None else ""
    parts = fields.get("parts", [])
    if parts is None:
        parts = []
    if not isinstance(parts, list) or any(not isinstance(p, str) for p in parts):
        raise ValueError("Parts are a list of the parts the app knows: " + ", ".join(PARTS) + ".")
    unknown = [p for p in parts if p not in PARTS]
    if unknown:
        raise ValueError(
            "That is not a part I know: " + ", ".join(unknown)
            + ". I know these parts: " + ", ".join(PARTS) + "."
        )
    cleaned["parts"] = [p for p in PARTS if p in parts]
    missing = [name for name in REQUIRED if not cleaned[name]]
    if missing:
        raise ValueError("A Car profile needs " + " and ".join(missing) + ".")
    return cleaned


def installs_for_part_change(
    before: dict[str, Any] | None, after: dict[str, Any]
) -> list[dict[str, str]]:
    """The Installs a confirmed parts edit records: fitted and removed parts.

    Pure: the caller stores each row with its date. No parts change, no rows —
    and the very first save records none either: the parts it names were on
    the car all along, so they explain no change.
    """
    if not isinstance(before, dict):
        return []
    old = set(before.get("parts") or [])
    new = set(after.get("parts") or [])
    rows = [{"part": part, "action": "fitted"} for part in PARTS if part in new and part not in old]
    rows += [{"part": part, "action": "removed"} for part in PARTS if part in old and part not in new]
    return rows


__all__ = [
    "FIELDS",
    "PARTS",
    "REQUIRED",
    "draft_from_text",
    "installs_for_part_change",
    "part_display",
    "profile_spec",
    "validate_fields",
]
