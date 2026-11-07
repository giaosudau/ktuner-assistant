"""The hosted beta: one complete app per invited owner, behind one small gate (ADR 0009).

No SQL knows about owners: each one gets their own `create_app`, database, chat file and
worker, so a query cannot cross owners. The gate is the only code that knows there are several.
`kta_server.app:app` stays the local run: one owner, no login.
"""

from __future__ import annotations

import asyncio
import hmac
import html
import json
import os
import re
import time
from dataclasses import dataclass, replace
from http.cookies import CookieError, SimpleCookie
from typing import Any

from . import llm
from . import copy as C
from .app import create_app
from .config import Settings, load_settings
from .db import Store

MAX_BODY_BYTES = 20_000_000
MODEL_CALLS_PER_DAY = 200
IDLE_SECONDS = 15 * 60
SWEEP_SECONDS = 60
COOKIE = "kta_owner"
COOKIE_MAX_AGE = 90 * 24 * 3600
SLUG = re.compile(r"[a-z0-9-]{1,32}")
# Safe in a URL and a cookie as it stands, so nothing has to encode it.
SECRET = re.compile(r"[A-Za-z0-9_-]{24,}")
JOIN = re.compile(r"/join/([^/]+)")
HTML, JSON, TEXT = b"text/html; charset=utf-8", b"application/json", b"text/plain; charset=utf-8"


def parse_owners(raw: str | None) -> dict[str, str]:
    """`slug:secret,slug:secret` as {slug: secret}. Any doubt stops the server.

    Errors name the entry by position: a text that failed as a slug may be a pasted secret.
    """
    if not raw or not raw.strip():
        raise ValueError("KTA_OWNERS is empty: with no owners the server refuses to start.")
    owners: dict[str, str] = {}
    for position, entry in enumerate(raw.split(","), 1):
        slug, _, secret = entry.partition(":")
        where = f"KTA_OWNERS entry {position}"
        if not SLUG.fullmatch(slug):
            raise ValueError(f"{where}: the slug must match ^[a-z0-9-]{{1,32}}$ (entries are slug:secret).")
        if not SECRET.fullmatch(secret):
            raise ValueError(f"{where}: the secret must be at least 24 letters, digits, - or _.")
        if slug in owners:
            raise ValueError(f"{where}: this slug is already used.")
        if secret in owners.values():
            raise ValueError(f"{where}: this secret is already used.")
        owners[slug] = secret
    return owners


def _page(title: str, paragraphs: tuple[str, ...], button: str | None = None) -> bytes:
    body = "".join(f"<p>{html.escape(p)}</p>" for p in paragraphs)
    form = f'<form method="post"><button>{html.escape(button)}</button></form>' if button else ""
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{html.escape(title)}</title>"
        "<style>:root{color-scheme:light dark}body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;"
        "margin:0 auto;padding:1.5rem 1rem}button{font:inherit;min-height:44px;padding:.5rem 1rem}</style>"
        f"<h1>{html.escape(title)}</h1>{body}{form}"
    ).encode()


NOTICE_PAGE = _page(C.NOTICE_TITLE, C.NOTICE_PARAGRAPHS, C.NOTICE_BUTTON)
INVITE_PAGE = _page(C.GATE_TITLE, (C.GATE_INVITE,))


async def _respond(send: Any, status: int, body: bytes, kind: bytes = HTML, *extra: tuple[bytes, bytes]) -> None:
    length = str(len(body)).encode()
    headers = [(b"content-type", kind), (b"content-length", length), (b"cache-control", b"no-store"), (b"referrer-policy", b"no-referrer"), *extra]
    await send({"type": "http.response.start", "status": status, "headers": headers})
    await send({"type": "http.response.body", "body": body})


async def _refuse(send: Any, status: int, words: str) -> None:
    await _respond(send, status, json.dumps({"detail": words}).encode(), JSON)


def _body_problem(headers: list[tuple[bytes, bytes]]) -> tuple[int, str] | None:
    """What is wrong with this request's stated size, if anything. h11 refuses a body longer than its header."""
    lengths = [value for name, value in headers if name == b"content-length"]
    # A chunked body would ignore any length it also states, so it never gets past here.
    if not lengths or any(name == b"transfer-encoding" for name, _ in headers):
        return 411, C.GATE_NO_LENGTH
    # bytes.isdigit is ASCII digits only: no sign, no underscore, nothing int() would be kind to.
    if len(lengths) > 1 or not lengths[0].isdigit():
        return 400, C.GATE_BAD_LENGTH
    # The first test keeps int() off a digit string long enough to make it raise.
    if len(lengths[0]) > 20 or int(lengths[0]) > MAX_BODY_BYTES:
        return 413, C.GATE_TOO_BIG.format(mb=MAX_BODY_BYTES // 1_000_000)
    return None


def _cookie(headers: list[tuple[bytes, bytes]]) -> str:
    raw = b"; ".join(value for name, value in headers if name == b"cookie").decode("latin-1")
    try:
        morsel = SimpleCookie(raw).get(COOKIE)
    except CookieError:
        return ""
    return morsel.value if morsel else ""


def _capped_caller(settings: Settings, store: Store) -> Any:
    """The one model call every path uses here: counted first, in this owner's own database."""

    async def caller(messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        day = time.strftime("%Y-%m-%d", time.gmtime(settings.now_ms() / 1000))
        if not store.count_model_call(day, MODEL_CALLS_PER_DAY):
            # Every model path treats any failed call the same way: the built-in reply stands.
            raise RuntimeError("Today's model calls are used up.")
        return await llm.post_chat(settings, messages, tools)

    return caller


@dataclass
class _Instance:
    app: Any
    lifespan: Any
    in_flight: int = 0
    last_used: float = 0.0


class Owners:
    """The pure ASGI app in front of every owner's own `create_app`."""

    def __init__(self, settings: Settings, owners: dict[str, str]) -> None:
        self.settings = settings
        self.owners = owners
        self._lock = asyncio.Lock()
        # shortcut: every owner shares one process and memory is limited only by the idle stop, move owners to separate processes when one owner's load slows another
        self._instances: dict[str, _Instance] = {}
        self._sweeper: asyncio.Task | None = None

    def _owner_of(self, given: str) -> str | None:
        """Every secret is compared, with no early exit, so timing names none of them."""
        found = None
        for slug, secret in self.owners.items():
            if hmac.compare_digest(secret.encode(), given.encode()):
                found = slug
        return found

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] == "lifespan":
            await self._lifespan(receive, send)
        elif scope["type"] == "websocket":
            await send({"type": "websocket.close", "code": 1008})
        elif scope["type"] == "http":
            await self._gate(scope, receive, send)

    async def _gate(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        path, method, headers = scope["path"], scope["method"], scope["headers"]
        if method == "GET" and path == "/healthz":
            return await _respond(send, 200, b"ok", TEXT)
        if join := JOIN.fullmatch(path):
            return await self._join(join[1], method, scope, send)
        if method in ("POST", "PUT", "PATCH") and (problem := _body_problem(headers)):
            return await _refuse(send, *problem)
        slug = self._owner_of(_cookie(headers))
        if slug is None:
            if path.startswith(("/api", "/agent", "/upload")):
                return await _refuse(send, 401, C.GATE_INVITE)
            return await _respond(send, 401, INVITE_PAGE)
        instance = await self._enter(slug)
        try:
            await instance.app(scope, receive, send)
        finally:
            instance.in_flight -= 1
            instance.last_used = time.monotonic()

    async def _join(self, secret: str, method: str, scope: dict[str, Any], send: Any) -> None:
        slug = self._owner_of(secret) if method in ("GET", "POST") else None
        # SameSite limits sending a cookie, not setting one: another site's form must not sign a visitor in.
        # Not Origin: no-referrer makes the real button's own POST say Origin: null.
        cross_site = dict(scope["headers"]).get(b"sec-fetch-site", b"same-origin") not in (b"same-origin", b"none")
        if slug is None or (method == "POST" and cross_site):
            await _respond(send, 404, INVITE_PAGE)
        elif method == "GET":
            # Never a cookie here: a link previewer in a chat app must not sign anyone in.
            await _respond(send, 200, NOTICE_PAGE)
        else:
            cookie = f"{COOKIE}={secret}; Path=/; Max-Age={COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax"
            forwarded = dict(scope["headers"]).get(b"x-forwarded-proto", b"").decode("latin-1")
            if (forwarded.split(",")[0].strip() or scope.get("scheme")) == "https":
                cookie += "; Secure"
            await _respond(send, 303, b"", TEXT, (b"location", b"/"), (b"set-cookie", cookie.encode()))

    async def _enter(self, slug: str) -> _Instance:
        """This owner's running instance, counted in flight so the sweep cannot stop it."""
        async with self._lock:
            if slug not in self._instances:
                self._instances[slug] = await self._start(slug)
            self._instances[slug].in_flight += 1
            return self._instances[slug]

    async def _start(self, slug: str) -> _Instance:
        settings = replace(self.settings, db_path=self.settings.db_path.parent / "owners" / slug / "ktuner.db")
        store = Store(settings.db_path)
        app = create_app(settings, store=store, llm_caller=_capped_caller(settings, store))
        # A manually called app runs no lifespan of its own: this starts its worker and chat saver.
        lifespan = app.router.lifespan_context(app)
        await lifespan.__aenter__()
        return _Instance(app, lifespan)

    async def sweep(self, now: float) -> None:
        """Stop instances idle for IDLE_SECONDS. `loadLog` re-reads the stored CSV, so nothing is lost."""
        async with self._lock:
            for slug, instance in list(self._instances.items()):
                if instance.in_flight == 0 and now - instance.last_used >= IDLE_SECONDS:
                    del self._instances[slug]
                    try:
                        await instance.lifespan.__aexit__(None, None, None)
                    except Exception as exc:  # noqa: BLE001 - one owner's failed stop must not end the sweep
                        print(f"[kta] stopping {slug} failed: {exc}")

    async def _sweep_forever(self) -> None:
        while True:
            await asyncio.sleep(SWEEP_SECONDS)
            await self.sweep(time.monotonic())

    async def _lifespan(self, receive: Any, send: Any) -> None:
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                self._sweeper = asyncio.create_task(self._sweep_forever())
                await send({"type": "lifespan.startup.complete"})
            else:
                self._sweeper.cancel()
                await self.sweep(float("inf"))
                await send({"type": "lifespan.shutdown.complete"})
                return


_app: Owners | None = None


def __getattr__(name: str):
    """`kta_server.owners:app` is built on first use: importing never reads the environment."""
    if name == "app":
        global _app
        if _app is None:
            owners = parse_owners(os.environ.get("KTA_OWNERS"))
            _app = Owners(load_settings(), owners)
        return _app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

