# CA-07 — Journey stepper, Open steps and History file in the sidebar

*Blocked by: CA-01*

Sidebar shows: Car summary (model · parts · active Map version), journey stepper (Car · Baseline
log · Read · Plan · Flash · Verify) with the current phase computed from `/api/state`, Open steps
and Waiting for you, History file export/import, Revert to KTuner basemap (when not on v1).

## Acceptance
- [ ] Fresh DB → "Car" current. After profile → "Baseline log". After a Flash → "Verify".
- [ ] Export downloads the History file; Import merges and reports what was added.
