# Judge the Fuel-quality score from this car's own logs, not forum numbers

The Fuel-quality score (Knock Control) is judged by **what it costs this car in timing**: KTuner's formula (retard = score × retard table) and this map's retard table under boost as measured in the logs (10.2°) give extra timing = 10.2° × (score − Baseline). Watch from 0.56 (0.7°), "no hard driving" from 0.62 held over 60 s (1.3°), Stop from 0.80 (3.2°, provisional: never reached). The formula and the 10.2° are evidence. The three cut points are judgement and are labelled that way. *(Amended 2 Oct 2026 after two fact checks: 0.70 was a forum figure; 0.62 was first wrongly called "measured".)* Forum ranges (≤ 0.60 fine, 0.6–0.7 acceptable) come from US 91/93 cars, and the app's old limits (≤ 0.65 good, Stop above 0.85) called 0.64 "good" on a car whose cool drives sit at 0.49 — by then the ECU is already pulling timing everywhere.

## Considered Options

- **Forum limits** — familiar to tuners, but too loose for this car and silent about its own drift.
- **Keep the app's limits** — no change, but graded the hottest drive (0.65) as good.
- **Per-map Baseline** — more precise after a Flash, but the ECU cannot read below 0.49 and every Cool drive sits at 0.49–0.53; revisit only if a Cool drive after a Flash ends above 0.53.

## Consequences

The 10.2° table value belongs to this Map, so after a Flash it is re-measured from that Map's boosted rows (retard ÷ score); until there are 100 such rows the previous value is used. The degree cut points (0.7° / 1.3° / 3.2°) stay fixed, so the score limits move with the Map. The Baseline (0.49 until three Cool drives) is still used, but only for the Shakedown and Unexplained change.
