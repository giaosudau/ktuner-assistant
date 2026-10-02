# 16 — Model scorecard and clarity judge

**What to build:** eval layers 2 and 3, run on demand with the key from `.env`, so the choice between `qwen3.8-flash:free` and a paid model is measured, not guessed.

- **Grounding scorecard:** replay the 9 drives plus a set of no-upload questions through each listed model; report per model the share of replies that pass verify first time, after repair, and that fall back, broken down by failure (wrong number, wrong cell, uncited claim, wrong action, banned advice).
- **Clarity judge:** an LLM judge scores each reply for one action, plain words, and naming the drive to log; a sample is written out for the owner to grade, and judge/owner agreement is reported.

**Blocked by:** 09

**Status:** ready-for-agent

- [ ] One command runs the scorecard for every model listed in config and prints a table
- [ ] Results are saved with the date and model so runs can be compared
- [ ] The clarity sample is written in a form the owner can grade quickly
- [ ] Not part of the default test run; needs no key to be skipped cleanly
