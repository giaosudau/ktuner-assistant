Type: grilling
Label: wayfinder:grilling
Status: resolved
Assignee: Chanh
Blocked by: 06-boost-after-downpipe, 07-response-and-lag, 08-catted-catless-subtype, 10-spool-proof-signal, 16-datalog-step-method

## Question

Synthesize the decisions into `fix-spec.md`: the card set (new and changed cards, drafted in `knowledge/proposed/` in the `kc-*` format with `numbers:` front matter and `source-doc` pointers), each conflict resolved to one source (cards vs `kta-build.js` dpCat / catless / map24 vs `kta-car.js` B2 vs `tuner-play-panel.md` Play B vs `kc-expectations`), the code / route fixes ordered in waves, and the owner-goal table: power, torque, response, lag, boost → one KTuner action or "no map change", with what the owner can and cannot expect. Run the map-actionability and full-value-story gates.

## Answer

[fix-spec.md](../fix-spec.md): an owner-goal table (power, boost, lag, response, fuel, timing, catted/catless → one KTuner action or "no map change", with proof and expectations), Wave 1 (Knowledge, Build/text/profile/routing, Engine core) in parallel, Wave 2 (Boost step + thresholds + mapcheck + ADR). On 2026-10-09 the owner asked to carry implementation into the map.
