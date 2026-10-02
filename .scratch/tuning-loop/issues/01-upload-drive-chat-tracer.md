# 01 — Upload a Drive in the chat, get a built-in reply (tracer)

**What to build:** the thinnest end-to-end path. The owner opens the chat app (Next.js + CopilotKit), taps upload, picks a TunerView CSV from phone or laptop, and a reply streams into the thread: the Verdict sentence with this Drive's numbers (intake air, Knock Control start → peak, worst trim, hard pulls) and the Flash plan headline. While it works, the harness steps appear as one collapsed line ("Checked N things · X s") that expands to each step with its tool inputs and outputs. No LLM: the reply is the built-in one, templated from engine facts.

Behind it: a Python server (FastAPI + LangGraph) whose graph runs ingest → decide → built-in reply; a Node worker that calls the existing engine (read a log, ingest into the Car history, report the Drive, the Flash plan) with JSON in and compact JSON out (ADR 0002); SQLite holding the Car history state and the raw CSV of every upload. The server exposes the agent to the chat over AG-UI and has its own upload endpoint.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Uploading a real TunerView CSV in the chat produces a streamed reply with the Verdict sentence, the four numbers and the Flash plan headline, all from the engine — `server/tests/seam1/test_upload_reply.py::test_upload_streams_a_reply_with_the_verdict_sentence_the_four_numbers_and_the_plan`
- [x] A Too-short drive replies "Nothing read: under a minute moving" and is not added to the Car history — `server/tests/seam1/test_upload_reply.py::test_a_too_short_drive_says_nothing_read_and_stays_out_of_the_car_history`
- [x] Harness steps stream as a collapsed summary and expand to each step's inputs and outputs — `server/tests/seam1/test_upload_reply.py::test_harness_steps_stream_as_a_collapsed_line_and_expand_to_inputs_and_outputs`
- [x] The raw CSV and the updated Car history are stored in SQLite; a server restart keeps them — `server/tests/seam1/test_upload_reply.py::test_the_raw_csv_and_the_car_history_survive_a_restart`
- [x] Uploading the owner's 9 drives in order gives the same verdicts as the engine's own car-history check — `server/tests/seam1/test_upload_reply.py::test_the_owners_nine_drives_in_order_give_the_engine_carc_history_check_verdicts`
- [x] The seam-1 test harness exists: tests post an upload and assert the reply events, with no LLM and no key — `server/tests/seam1/` (34 tests, `cd server && python3 -m pytest tests/seam1 -q`)
- [x] One browser smoke test: upload a drive, see the reply card, expand the steps — `web/e2e/chat.e2e.js`, `cd web && npm run e2e`
- [x] The engine's existing suite still passes untouched — `npm test`, 115 pass / 0 fail

## PM notes — decisions a later ticket must know

1. **A Too-short drive shows no Verdict word and no four numbers.** `CONTEXT.md` says
   it "gets no verdict", so the card shows the sentence, the window ("nothing read —
   your Car history still holds N Drives"), the harness steps and the one Next step,
   and nothing else. `overview` and `driveFacts` are not run either, so the line reads
   "Checked 4 things" rather than claiming a safety read that did not happen.
2. **The window line says which Drives it read** ("based on your 3 Drives, 23 Aug 19:59
   to 23 Aug 20:38"), because drive windows are ticket 10. The Flash-bounded form
   ("since the Flash on 30 Aug") is that ticket's to add.
3. **`POST /upload` stores the raw CSV and returns an upload id; the Drive is created by
   the graph's `ingest` node.** The Drive is still created server-side and never in the
   browser (spec §Chat UI), and this way every step of the reply — including "Read the
   TunerView log" — streams inside the AG-UI turn instead of happening before it.
4. **The reply reads: sentence, window, four numbers, Verdict word, Flash plan headline,
   collapsed harness steps, one Next step.** The sentence and the window are streamed as
   two TEXT_MESSAGE messages; the rest is the typed card in `state.reply`, read from
   STATE_SNAPSHOT. The web never parses prose.
5. **The harness summary rides a `CUSTOM` event named `harness`** carrying
   `{checked, seconds, line, steps}`. `checked` and `seconds` are the server's own
   measurement, so the line says what the server actually did. The per-step inputs and
   outputs are the real `TOOL_CALL_ARGS` / `TOOL_CALL_RESULT` payloads.
6. **A trim Stop leads with the trims.** When `|worst fuel trim| > ±5 %` the trim clause
   comes first in the first sentence, because it is the cause; when the trims are inside
   ±5 % the clause is absent and the sentence is exactly the shape the lead specified.
7. **No number is computed in Python.** `Worker.limits` is the one place the thresholds
   live, computed from `KTA.LIMITS` / `KTA.CAR_RULES`, and the degree a Fuel-quality score
   costs (`10.2 × (score − 0.49)`) is computed in the worker and handed over with the
   Drive. `server/tests/seam1/test_reply_words.py` fails if `copy.py` ever gains `10.2`.
8. **`POST /api/state` returns every seam a later ticket needs** — Car profile, Car history,
   Baseline, Flash plan, Map versions, Flashes, Installs, answers, Open steps, Drives,
   unanswered questions (empty) — over empty tables that already exist in SQLite.
   `answers`, `flashes` and `map_versions` are written by the worker's ops but not yet
   reached from the graph; a ticket that adds "I flashed it" wires them.
9. **Open steps are recorded, never settled.** Every Next step writes one `open_steps` row;
   settling them is the Open-step ticket's job.
10. **Engine bug found, not fixed** (ticket 02 owns `engine/`): none found in this slice.
    The one thing worth knowing is that `kta-ask.js` must be required explicitly by any new
    Node entry point — `kta-car.js` does not pull it in, so `KTA.ask` is undefined until
    `require('engine/kta-ask.js')` runs. `server/kta_worker/worker.js` does this.
