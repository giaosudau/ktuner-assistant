# Stage 2 rubric: categorize, fact-check, conflict check, pick

Inputs: `claims/*.jsonl` (+ `raw/` for context). Our ground truth: `docs/research/fact-check.md` (wins on any number), `knowledge/cards/*.md`, `knowledge/playbook.md`, `docs/research/owner-voices.md`, `docs/research/ktuner-help-pages.md`, `data/thresholds.json`.

## 1. Cluster
Merge claims that say the same thing into one **finding** (keep all source ids). Count independent sources (different authors/channels; a vendor repeating itself counts once).

## 2. Basis (same scale as `fact-check.md`)
**Primary** (KTuner about KTuner; vendor about its own product; maker docs) · **Data** (log, dyno or timeslip shown) · **Physics** · **Consensus** (≥ 3 independent T1/T2 sources, no credible dissent) · **Forum** (1–2 sources, no evidence) · **Contested**.

## 3. Verdict per finding
- ✅ **Supported** — Primary, Data, Physics, or Consensus, and nothing in our ground truth contradicts it.
- ⚠️ **Plausible** — Forum-level only; usable as context, never as a limit.
- ❌ **Refuted** — contradicted by our car's data, a primary source or physics. Say what contradicts it.
- ⚔️ **Conflict** — credible sources disagree. List both sides, which has better basis, and what log channel or test would settle it on our car.

## 4. Fit for our car
`fits` (T1, CVT, E10/RON95, hot climate, Starter 21 Dual, intake + downpipe) · `fits-with-caveat` (T2 or different fuel/mods; say what differs) · `not-ours` (manual, NA, Type R numbers, E85 build, big turbo).

## 5. Against our knowledge base
For each kept finding: `new` (no card covers it), `confirms <card-id>`, `extends <card-id>` (adds a source, a nuance, a table name), `contradicts <card-id>` (flag loudly; never resolve silently).

## 6. Value score (1–5)
5 = changes what the app tells the owner or which map action it picks. 4 = a missing safety rule, table name, or symptom→cause we can check in logs. 3 = useful context or expectation-setting with numbers. 2 = nice to know. 1 = noise. Keep ≥ 3 that fit or fit-with-caveat.

## 7. Map actionability
Every kept tuning finding names the KTuner table/setting it touches (exact name) and the log channel that proves it, or says `log-only` / `no map change`. Ignition, fuel and custom-tune edits beyond what our app supports are kept as `out-of-scope (context)`.

## Output files
- `analysis/findings.jsonl` — one object per finding: `id, category, finding, sources[], basis, verdict, fit, kb_relation, value, ktuner_setting, log_channel, notes`.
- `analysis/conflicts.md` — every ⚔️ and every `contradicts`.
- `analysis/picks.md` — value ≥ 3 and fit, grouped by category, each with a proposed card change (new card text or the line to add to an existing card), sources linked.
