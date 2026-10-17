# Log: vendors (17 Oct 2026)

Queries (WebSearch): 27WON 11th gen 1.5T KTuner 300 whp guide; Phearable 11th gen mod guide; TSP 11th gen KTuner basemap; PRL 11th gen KTuner tune; KTuner base maps 11th gen Starter 21 Dual Tune; phearable stage 1.5 race; hybrid racing / RV6 1.5T KTuner; 27won performance 1.5T KTuner downpipe.

Fetch: Python urllib (browser UA) and one Scrapling make_request; 11 s between requests.

| URL | Status |
|---|---|
| twostepperformance.com: 6 tune/install pages (non-Si S1, Si S1, S1+, Stage 2 flex, Integra S1, install guide) | ok |
| twostepperformance.com 27WON Gin turbo, 27WON downpipe pages | ok |
| prlmotorsports.com/blogs/news/prl-1-5t-turbo-blog (Feb 2026, 11th gen KTuner dyno) | ok |
| phearable.net (the .com redirects here): 11th gen Si/non-Si tune pages, mod guide, V1.2 vs V2, V2 slot upload, Integra mod guide, tech-area index | ok (urllib on phearable.com returned 406; phearable.net works) |
| 27won.com blog Pt 4 (Gin dyno, KTuner by Drob) | urllib 403; read via Scrapling make_request (200); raw file keeps the verbatim sentences used in claims |
| store.27won.com/ktuner-v2-honda-civic.html | 403, skipped |
| hybrid-racing.com KTuner V2 page | ok (hardware blurb only, little tuning content) |
| RV6 | Only a 10th gen downpipe listing found in search; no 11th gen KTuner tune content, not saved |
| Hondata | skipped (no 1.5T engine facts needed) |
| "27WON 300 whp guide" | Not found. Closest: Gin blog (280 whp on 91 + tune, 329 whp E30) |

Not captured: Phearable Integra/10th gen guide bodies were fetched (integra, 11th) but their bulleted mod lists are mostly images/short; only the 11th gen guide is mined for claims. Phearable pages show "Tune files are locked from editing a majority of parameters" which matters for map visibility in KTuner.

Counts: 24 raw files. 59 claims in claims/vendors.jsonl (quotes script-verified).
