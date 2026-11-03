# The product improvement loop

One run of this loop = one **Round** of product improvement. It is run by hand or by the scheduled
task `ktuner-ux-loop` (every 5 hours). Every run reads this file first and `STATUS.md` second,
and leaves `STATUS.md` ready for the next run.

Product truth: `/PRODUCT.md` (who, principles), `/DESIGN.md` (tokens, components), `/CONTEXT.md`
(every word the owner reads). Architecture: `docs/adr/` — the engine owns every number and
verdict, the server words them, `web/` only lays them out. A UI change that needs a number the
server does not send is a server change first, never a number made up in the browser.

## The team (each run writes its debate in their voices)

| Role | Asks, every run |
|---|---|
| Principal Product Manager (lead) | What does the owner fail at today? Which change shows value the owner can *see*? What do we cut? Ships ≥ 10 items or says why not. |
| Principal Tuner | Is every number, band and word true for a Civic FE 1.5T on E10? Does the UI push the owner toward a safe action? |
| KTuner (vendor view) | Are table names, map slots, TunerView channel names, flash steps spelled and ordered as KTuner shows them? |
| Hondata (competitor view) | What does FlashPro/Hondata Logger do better for the same job (log → read → change → flash)? Copy the standard, don't invent. |
| Car Owner (first-timer, on a phone, parked) | Do I understand this screen in 5 seconds? What would I tap wrong? Where am I scared? |
| Principal Frontend Engineer | Smallest diff, existing component reused, tests, a11y, 390 px, dark mode, reduced motion, no new dependency. |

## The cycle (SDLC — never skip a phase)

1. **Observe.** Walk the real app as a first-time owner at 390×844 and 1280×800 (script:
   `.scratch/ux-loop/walk.js`, see its header; servers via `.claude/launch.json`). Screenshot each
   step. Read the screenshots. Write `audit-rN.md`: journey table, comprehension, mistake
   prevention, visualization gaps, mobile, a11y, and the **detail review** below.
2. **Research and fact-check.** Every fact the UI will show comes from `data/thresholds.json`,
   `knowledge/cards/` (with their cited source), or `docs/research/`. Cross-check each against
   `docs/research/fact-check.md`. A conflict is logged, not guessed through. Owner pain comes from
   `docs/research/owner-voices.md` (quote it).
3. **Debate.** The PM leads; each role speaks; disagreements stay on the page with the call made
   and why. Output: `discussion-rN.md`.
4. **Decide.** Score each candidate 1–3 on: owner sees the impact · prevents a mistake · fact
   backed · small diff. Take the top items (≥ 10 per run when the backlog allows). Each item gets:
   problem (owner words), fix, value, a concrete example, and **how to test and verify** it.
5. **Build.** Test first where there is logic (`npm test`, `cd server && uv run pytest`). One writer
   per file at a time; subagents may split work by file. Reuse components and CSS tokens.
6. **Verify.** `npm test` · `cd server && uv run pytest -q` · `cd web && npx tsc --noEmit` ·
   browser check at 390 and 1280, light and dark, with before/after screenshots in the scratchpad.
7. **Review.** A code-review subagent on the diff; fix what it confirms.
8. **Commit.** One commit per item or per tight group, message says the owner-visible change.
9. **Record.** Update `STATUS.md`: what shipped (with proof), what was cut and why, the next
   run's backlog ranked. Never leave the tree red.

## Detail review checklist (every screen, every control)

- Label: a first-time owner knows what happens before tapping. Verbs on buttons.
- Position: the primary action sits where the eye ends (bottom-right of a card; full width on a
  phone); a destructive or "not now" action never sits where the primary one was last time.
- Weight: one primary per card. Primary = filled accent; secondary = ghost; tertiary = link.
- Colour: accent = action; ok / watch / stop = verdicts only; the word always shows beside it.
- Disabled: says why (title and visible hint), never a silent grey button.
- Text: no truncation of what the owner needs (map name, file name); no copy repeated or
  contradicted within one reply; KTuner names exactly as KTuner spells them.
- Spacing and alignment: cards share padding, header style and gap; numbers right-aligned,
  tabular.
- Targets ≥ 44 px on a phone; focus ring visible; works with keyboard.
- Motion: tells state (working, done, changed), ≤ 300 ms, off under `prefers-reduced-motion`.
- Charts: a caption that says what it shows; the numbers also in text; bands only from
  `data/thresholds.json` or a cited card.

## Real-world scenarios every run re-checks

Wrong map slot tagged · wrong fuel tagged · non-TunerView CSV or a too-short log · profile edited
but not saved · ticking only some cells then "I flashed it" · flashing back the wrong file ·
hot day / Hot restart log for a step that needs a Cool drive · pedal never floored · logger rate
too low · missing AFR Command / MAF Hz · phone in sun (contrast) · slow network mid-upload ·
second chat on the same car · no LLM key (built-in replies).
