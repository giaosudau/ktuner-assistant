# Log: ktuner-official (17 Oct 2026)

Method: Python urllib (plain HTTP GET, browser UA) against http://www.ktuner.com/KTunerHelp/, page list taken from table_of_contents.htm (144 pages), 10 s sleep between requests (observed ~13 s). Also ktuner.com pages. Scrapling make_request used once for the help index (200). No blocks, no 429s, no retries needed.

## Result
- 144/144 KTunerHelp pages: ok. Saved to raw/ktuner-official/<page>.md (image-only content such as example tables and dyno charts is NOT captured: those are PNGs; text around them is).
- ktuner.com: /22civicturbo/, /22civicsi/, /23integra/, /16civicturbo/, /faq/, /downloads/ ok (saved as site-*.md). Not fetched: /ktuner15tswap*, /forums/ (KTuner support forum, possible next source), other platforms.
- No separate FAQ about tuning exists; /faq/ is 5 hardware questions. Release notes = version_history.htm (Version 1.0.14.2 latest).
- Basemap list for the 22+ Civic 1.5T (non-Si): Starter 16.5 (Stage 0), Starter 18 (Stage 1), Starter 1 Dual Tune 1 (18PSI/Factory), Starter 1 Dual Tune 2 (18PSI/16.5), Starter 21 (Stage 2), Starter 21 Dual Tune 1, Starter 21 Dual Tune 2. 22+ Si list adds Starter 21 Flex Fuel and "Starter 22 and 23". Descriptions, boost per mode and "up to N lb-ft / N whp" claims are in raw/ktuner-official/site-22civicturbo.md and site-22civicsi.md.
- Pages with no real content (placeholders/hardware only): index, getting_started, flex_fuel_tuning (TODO text), many V1/V1.2 hardware pages.
- Important gap: there is NO page on Knock Control internals beyond ignition_timing_and_knock_control, no page on artificial knock, no 11th-gen-specific torque/lambda tables (only the Type-R "Bosch torque targeting" pages, tier T3).

## Counts
Pages 150 (144 help + 6 site). Claims: 118 in claims/ktuner-official.jsonl (every quote verified verbatim against the raw file by script).
