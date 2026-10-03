# Every map change is checked twice: by the engine and by independent Python code

A wrong cell typed into KTuner can hurt the engine, so a Flash plan's cells pass two checks written separately: the JavaScript engine that made them (rules P1–P9), and deterministic Python code that re-reads the original map data (`data/ktuner-maps-digitized.json`, the KTuner basemap Starter 21 Dual Tune 2, plus every later Map version) and checks every cell on its own: table and axes exist, each before equals the active Map version, each after sits inside the thresholds, pairs match, one table family. If the two disagree, the Flash is blocked. Neither check is an LLM.

The thresholds both checks use live in one data file, each with its value, unit, basis (measured / source / judgement) and source (`fact-check.md` section or the log it came from), so a threshold can be audited and tested by itself; the two checks share the numbers, never the code.

## Considered Options

- **Trust the engine alone**: its rules are tested, but one bug then reaches the owner's ECU with nothing behind it.
- **Let the Python check call the engine**: less code, but it is then the same check twice, not two.

## Consequences

Tests feed both checks the same generated changes (in bounds, off by one cell, wrong before, out of bounds, broken pair) and fail on any disagreement. A threshold change is a data change with its basis, reviewed like code.

The banned-advice policy (knock sensitivity, timing, protections) is ported the same way, in `engine/kta-ask.js` and `server/kta_server/verify.py`. It has the same discipline: one case list, `server/tests/banned_advice_cases.json` (text, lang, category, expected), run by `test/banned-advice.test.js` and `server/tests/test_verify.py`. Edit a banned phrase in one port and the other test fails until the list is updated. Boost and AFM-curve phrasing are policed differently on purpose and are not on the list.
