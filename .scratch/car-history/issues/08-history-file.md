# 08 — History file export and import

**What to build:** The owner can export the Car history (drive summaries, Flashes, hidden drives, answers to Unexplained change) to one History file, and import one back. Import **merges**:
- drives by start time, the newer summary winning;
- Flashes by time + Map, edits winning over originals;
- hidden drives and answers combined.

Import never deletes anything. The file has a version and stays on the owner's machine; nothing is uploaded.

**Blocked by:** 03 — Car module and Car history

**Status:** ready-for-agent

- [ ] Export, then import into an empty browser: the Car history, Flashes and Baseline are identical.
- [ ] Importing an older file into a newer state loses no drive and no Flash.
- [ ] A file from a future version is refused with a clear sentence, never half-imported.
- [ ] Export / Import sit next to *Load folder* in Block 4.
- [ ] New wording in English and Tiếng Việt.
