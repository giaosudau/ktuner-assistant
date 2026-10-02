# 08 — History file export and import

**What to build:** The owner can export the Car history (drive summaries, Flashes, hidden drives, answers to Unexplained change) to one History file, and import one back. Import **merges**:
- drives by start time, the newer summary winning;
- Flashes by time + Map, edits winning over originals;
- hidden drives and answers combined.

Import never deletes anything. The file has a version and stays on the owner's machine; nothing is uploaded.

**Blocked by:** 03 — Car module and Car history

**Status:** ready-for-agent
**Status:** done (engine: newer-wins merge + union + clean refusal verified; suite 113/113)

- [x] Export, then import into an empty browser: the Car history, Flashes and Baseline are identical.
- [x] Importing an older file into a newer state loses no drive and no Flash. (Extended: newer drive summaries win in both directions, flash edits win, hidden drives and answers union — importing an older file keeps the newer summary.)
- [x] A file from a future version is refused with a clear sentence, never half-imported. (Engine returns `{error:'future-version'}` with the state untouched; the sentence itself renders UI-side.)
- [ ] Export / Import sit next to *Load folder* in Block 4. (UI track — other agent.)
- [ ] New wording in English and Tiếng Việt. (UI track — other agent.)

PM note: the owner gains a History file that can neither lose drives nor resurrect stale edits — merging is newer-wins/union by construction, never delete. Verified useful: round-trip identical including shakedown carry-over state (shares now survive export/import). Residual risk: none in the merge logic; file picker + placement are UI-track.
