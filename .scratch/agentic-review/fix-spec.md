# Fix spec: make the tuner-shop chat truly agentic (synthesis of the agentic audit)

Verdict: the architecture is agentic (supervisor front-agent, tool-driven tuner, validated generative-UI cards, measured harness, strict verify) but the prompts and router still hardcode around the model, and the transport is snapshot-only. The engine decides numbers/cells; the LLM must orchestrate prose/routing — today it rephrases pre-shaped answers and regex pre-filters its input.

## What stays deterministic (never agentic)

- Engine verdicts, Next step, Flash plan cells, two map checks (ADR 0002/0003).
- `verify.py` + `mapcheck.py`: numbers-from-tools, cells==plan, banned advice EN+VI, citations exist.
- Gates: backfill-as-history (D7), readback mismatch as Next step, one-family-per-Flash, premium test on matched drives, teaching locks (ignition/knock read-only, WOT target, boost lower-only).
- Card values: server fills from Car file; owner confirms in card.

## What becomes agentic

- Opener prose, routing of every typed message, teaching order/wording, follow-up chips (proposed by model, checked by code).

## Waves (safety × leverage)

### Wave 1 — Safety with teeth (highest)
- `verify.py`: add citation-support judge (cited card topic/title must overlap the sentence; unknown `[id]` already fails) + false-positive regression per rule (rpm-as-psi class).
- Lock reasons cite forum cards (`kc-wot-lean-timing`, `kc-table-ignition`) in tour copy.
- Accept: `tests/test_verify.py` + new judge tests green; live scorecard fallback rate down on 9 drives.

### Wave 2 — Let the model route and speak
- `agent.py system_prompt`: drop verbatim Start-with-this-sentence; keep 280-word / one-step / cite-or-propose as verify checks.
- `chat.py` + `desk.py` + `ask.py`: front-agent + `ask_tuner` decide every typed message with key; `sort_intent`/`classify`/keyword search become no-key fallback only (`_without_model`).
- Accept: greeting/vague-opener set in `owner-queries.md` routes via model; no-key replies byte-identical.

### Wave 3 — Trace and streaming parity
- `graph.py`: upload-path spend cap (mirror `MAX_CALLS`), trace `suggest` steps, merge tuner handoff steps into front trace.
- `web/lib/useChat.ts`: handle STATE_DELTA + MESSAGES_SNAPSHOT + TOOL_CALL_END; stream chat tool args like drive path; chat work row = drive work row.
- Keep 4 cards; `uiTools.ts` mirror unchanged.
- Accept: chat turn shows live steps; snapshot-only code paths removed.

### Wave 4 — Personalized brief + eval layer
- Brief opens with owner's missing gauges (logger setup D26) + goal reorders wording only (D27); confirm TunerView max sample rate before keeping 10/s bar (fails 9/9 at 7.5/s).
- Extend `eval.md` + `owner-queries.md`: greeting/vague-opener coverage, citation-support asserts, routing asserts; live scorecard rerun on deepseek/qwen.
- Queue behind Waves 1–3; aligns with tracker TS-28 → TS-29 → TS-30 → TS-31.

## In flight

Two implement agents running: backend (Waves 1–2, server files) and frontend streaming (Wave 3, web files). They continue; Waves 4 + eval follow.

## Explicitly not in this spec

Slot-aware Map versions (D15 phase 2), ignition load-axis + remove-timing proposals, OTel spans, separate reviewer node — queued, not this spec.
