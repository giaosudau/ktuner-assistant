# 10 — Car profile, Install and the drive window

**What to build:** setup in about a minute, and answers about the car as it is now.

- **First open:** the chat asks the owner to describe the car in their own words (with an example). The LLM fills a typed Car profile card (model, engine, transmission, fuel, climate, KTuner basemap prefilled Starter 21 Dual Tune 2, parts fitted as enums); the owner corrects any field and confirms. Nothing is saved before confirm.
- **No Drive yet:** only Car profile setup runs; tuning questions get "upload a drive first".
- **Editing parts later** records an Install with its date.
- **Drive window:** the latest Drive plus every Drive since the last Flash or Install, capped at 14 days; older Drives feed only the Baseline and trend pictures. Every reply states its window ("based on your 3 drives since the Flash on 30 Aug").

**Blocked by:** 03, 08

**Status:** ready-for-agent

- [ ] Describing the owner's car fills the card correctly; a corrected field is saved as corrected
- [ ] With no key, setup falls back to a plain form with the same fields
- [ ] An Install appears in the Car history and starts the drive window like a Flash
- [ ] Every reply states its drive window; drives outside it don't change the Next step (seam-1 test)
- [ ] With no Drive, a tuning question is answered with "upload a drive first"
