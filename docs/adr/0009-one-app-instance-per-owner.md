# One app instance per owner, behind one small gate

*6 Nov 2026. `.scratch/eng-loop/stack-r1.md` "Final call". ADR 0002 (the engine is reached over one
Node worker) and ADR 0005 (a failed model call leaves the built-in reply) still bind.*

## Context

The hosted beta gives one URL to 5–10 invited owners. The app holds one car per database, and
`db.py` has 46 SQL statements. Adding an `owner_id` column means every one of them must filter on
it, for good; one that forgets exposes another owner's car.

## Decision

1. **Each owner gets a whole app.** `kta_server/owners.py` is a small ASGI gate that maps an owner to
   their own `create_app`: one database, one chat file, one worker, under
   `<db folder>/owners/<slug>/`. No SQL knows that owners exist, so no query can cross them.
2. **Invite links, no sign-in provider.** `KTA_OWNERS` lists `slug:secret`. Opening `/join/<secret>`
   shows the risk notice; pressing its button sets an HttpOnly cookie. A GET never sets the cookie, so
   a link previewer signs nobody in. Everything except `GET /healthz` needs the cookie, and a server
   with a bad or empty list refuses to start. Revoking means removing the entry and redeploying.
3. **Limits at the gate.** A body over 20 MB, or one that does not state its size, never reaches an
   app. Each owner has 200 model calls per UTC day, counted in their own database; past that the call
   fails the way a provider failure does, so the built-in reply stands.
4. **Instances are lazy.** One starts on the owner's first request and stops after 15 minutes idle.
   Nothing is lost: the stored CSV is read again when needed.

`kta_server.app:app` stays the local run: one owner, no login.

## Considered Options

- **An owner column**: one app and less memory, but 46 statements to get right every time.
- **A process per owner**: real isolation of memory and load, and more to run than 5–10 owners need.
- **A sign-in provider**: a new dependency and a console, for people we invite by hand.

## Consequences

- Memory grows with live owners: each one is an app and a Node process. All owners share one Python
  process, so one owner's heavy turn can slow another. Move owners to separate processes when that
  happens.
- The secret is the identity, and it lives in a cookie for 90 days. Anyone who gets the link before
  it is revoked can press the button, so it is sent privately.
- The person running the beta can read every owner's data. The notice says so.
