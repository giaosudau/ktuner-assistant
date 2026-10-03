"""The KTuner basemap's tables: Map version 1's copy of the Map.

Map version 1 is the KTuner basemap the owner gave the app — Starter 21 Dual
Tune 2 — as held in `data/ktuner-maps-digitized.json`. This module reads that one
file, once, and nothing else: it is the *source* the Map version is seeded from,
so the app can hold a Map version with its full tables before any Drive exists.

Why Python may read it (ADR 0002 says Python never imports the engine, and it
does not): this is map data, not tuning math. ADR 0003 wants the second map check
to re-read the original map data itself and independently of the engine, so both
sides read the same file and share the numbers, never the code. The engine
reads it through the worker; this is the other read.

A Map version's tables are stored in SQLite (`map_versions.tables`), not in the
Car history document: the whole KTuner map is ~166 kB and would ride out with
every Drive otherwise.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
KTUNER_MAP_FILE = REPO_ROOT / "data" / "ktuner-maps-digitized.json"

# `tablesFrom` on a Map version whose tables are this file — the same token the
# engine's `KTA.CAR_RULES` state uses, so the worker and SQLite agree on it.
KTUNER_BASEMAP_SOURCE = "ktuner-basemap"


@lru_cache(maxsize=1)
def basemap_tables() -> dict[str, Any]:
    """Every table of the KTuner basemap, exactly as digitized.

    The same shape the engine's `readTable` reads: `{ id: { rpm_axis, values,
    notes } }`. Read once and cached: the tables never change under the app.
    """
    with KTUNER_MAP_FILE.open(encoding="utf-8") as handle:
        tables = json.load(handle)
    if not isinstance(tables, dict) or not tables:
        raise RuntimeError(f"The KTuner map data is not readable: {KTUNER_MAP_FILE}")
    return tables


def table_count() -> int:
    return len(basemap_tables())


__all__ = ["KTUNER_BASEMAP_SOURCE", "KTUNER_MAP_FILE", "REPO_ROOT", "basemap_tables", "table_count"]