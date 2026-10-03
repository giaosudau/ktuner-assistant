# 11 — Ask without uploading

**What to build:** the owner can talk to the assistant between uploads ("why is my car slower in the heat?", "what does MAF Scaling do?"). The graph runs agent → verify → repair/fallback over the current drive window and the knowledge cards, with the same checks as an upload reply. A request for a change ("give me +2 psi", "add timing") gets the Flash plan's answer and exactly what would unlock it, never a new edit.

**Blocked by:** 09, 10

**Status:** done

- [x] "Why is my car slower in the heat?" is answered from the owner's own drives (for example 30 Aug 15:29 vs 16:01) with citations — `test_why_slower_in_the_heat_is_read_off_the_owners_two_drives`
- [x] "Give me +2 psi" returns the Flash plan's answer with its lock reasons; no cells — `test_give_me_plus_2_psi_is_the_flash_plans_answer_with_its_lock_reasons`
- [x] "Add timing" is refused with the reason (ignition is never edited) — `test_add_timing_is_refused_with_the_reason`
- [x] The reply states its drive window — every `test_ask.py` answer asserts `window`
- [x] Seam-1 tests with the fake model cover the three questions above — built-in path per question; `test_the_fake_model_answer_is_checked_and_falls_back_to_the_built_in_one` (heat, via verify) and `test_a_request_for_a_change_never_reaches_the_model` (psi, timing)

PM note: a change request never reaches a model, so no key is needed for the two safest answers. The typed box in `web/components/AskBox.tsx` shows answer, window, then footnoted cards; not browser-tested here.
