# Product

<!-- impeccable:product-schema 1 -->

> Written 3 Oct 2026 without an interview round: the owner said "Do not ask me. Choose best
> options." Facts marked *(inferred)* come from the brief and `docs/research/`, not from an answer.

## Platform

web

## Users

- **The owner-tuner (primary).** Owns one turbo Honda (today: Civic FE 1.5T CVT, Vietnam E10
  RON95, hot traffic). Bought KTuner, fitted bolt-ons, flashed a KTuner basemap, and now wants the
  map fitted to *their* car, parts and taste. Logs with TunerView, often on a phone, often parked.
  Not a professional tuner; afraid of hurting the engine or paying for the wrong fix.
- **Pro tuners (secondary, reference only)** *(inferred)*: Hondata / KTuner / WinOLS remappers whose
  log → read → change → flash → re-log loop the app imitates. They are not users of this build.

## Product Purpose

A chat with a tuner who remembers the car. The owner talks, uploads a datalog, and gets back: is
it OK (in their numbers), what the log shows, which changes are valid now, a step-by-step plan
naming the exact KTuner table and cells, a prompt to flash and confirm, and how to log the next
drive that proves it. The loop repeats until nothing is left to change; every confirmed map and
setting is saved to the Car profile.

Success: fewer Drives to proof and fewer Wasted drives; an owner who never wonders "what do I do
now?".

## Positioning

The only tuning chat whose every number, verdict and map cell comes from a deterministic engine
run on the owner's own logs and checked twice before it is shown; the LLM explains and
orchestrates, it never decides a verdict or writes a cell. The reasoning and tool calls are on
screen, collapsible, like Claude / ChatGPT / Cursor.

## Operating Context

- Phone or laptop browser; TunerView CSV exported after a drive; KTuner desktop/app open to type
  cells and flash.
- One car, one owner, local-first (no login, SQLite). English replies; KTuner names spelled as
  KTuner spells them; vocabulary from `CONTEXT.md`.

## Capabilities and Constraints

- Engine (`engine/`) owns every Verdict, Flash plan and cell; Python server orchestrates; `web/`
  only renders (ADR 0002, 0004). Map changes are checked by two independent checks (ADR 0003).
- Never edits ignition, knock-sensitivity or protection tables; never promises power; emissions
  advice carries the đăng kiểm warning.
- Works with no LLM key (built-in replies).

## Brand Commitments

- **Copy the category standard, don't invent** (owner, 3 Oct 2026): the chat looks and behaves like
  Claude chat / ChatGPT / Cursor, built on CopilotKit / AG-UI ideas (generative UI cards, visible
  tool calls, human-in-the-loop confirms). One composer with attach; thread of messages; reasoning
  collapsible. The previous dashboard-of-cards UI is the anti-reference.

## Evidence on Hand

- The owner's 9 real drives (`data/example-*.js`), the loop eval's expected path
  (`.scratch/tuning-loop/spec.md`), owner questions in their words (`docs/research/owner-voices.md`).
- No real user interviews have been run; `.scratch/chat-app/user-research.md` is a synthesis from
  forum research and is labelled as such. No testimonials or usage numbers exist.

## Product Principles

1. **Conversation first.** Everything happens in the thread: setup, upload, analysis, choices,
   flash confirm. Side panels only mirror state.
2. **Reassure with evidence, then one thing to do.** Verdict sentence first, one Next step.
3. **Show the work.** Tool calls and checks are visible and collapsible; model thinking is labelled
   unchecked.
4. **The owner confirms every state change.** Profile, answers, "I flashed it" are explicit taps.
5. **Honest expectations.** "No map change" is an answer; locked options say what unlocks them.

## Accessibility & Inclusion

Phone-first touch targets (≥ 44 px), works at 375 px, keyboard-complete, light and dark themes
follow the system, verdicts never by colour alone.
