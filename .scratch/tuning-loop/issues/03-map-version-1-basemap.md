# 03 — Map version 1 is the KTuner basemap

**What to build:** the app knows which map every Drive ran on from the first upload. The original KTuner basemap Starter 21 Dual Tune 2, as held in the app's map data, is Map version 1 and is active from the first Drive. It starts no Shakedown drive (the owner didn't just flash it). Every reply says which Map version the Drive ran on ("on Map version 1 · Starter 21 Dual Tune 2"). Map versions are stored in SQLite with their full tables.

This replaces "Map not recorded" and fixes the prototype's side effect where recording the starting map made the first Drive a Shakedown drive.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A fresh car has Map version 1 = Starter 21 Dual Tune 2 with its tables, before any upload
- [ ] The first Drive is not a Shakedown drive and shows "on Map version 1"
- [ ] The engine's Map for a Drive is the Map version active at its start (engine test)
- [ ] The Flash plan's Undo can name a Map version (engine test)
- [ ] Seam-1 test: uploading the 9 drives shows Map version 1 on each
