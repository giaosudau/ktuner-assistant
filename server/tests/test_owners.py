"""The hosted beta's gate: owners can't cross, nothing is reachable without an invite, limits hold."""

from __future__ import annotations

import asyncio
import importlib.util
import re
import sqlite3
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from kta_server import owners as O
from kta_server.app import create_app
from kta_server.config import Settings

_spec = importlib.util.spec_from_file_location("seam1_conftest", Path(__file__).parent / "seam1" / "conftest.py")
_seam1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_seam1)
owner_csv, FILE_NAMES = _seam1.owner_csv, _seam1.OWNER_FILE_NAMES

SECRET_A = "a" * 24 + "-alpha"
SECRET_B = "b" * 24 + "_bravo"
OWNERS = {"ann": SECRET_A, "ben": SECRET_B}
KEYED = {"llm_api_key": "fake-key", "llm_base_url": "http://model.invalid", "llm_model": "fake-model"}
LATER = 16 * 60


def _gate(tmp_path: Path, **settings) -> O.Owners:
    return O.Owners(Settings(db_path=tmp_path / "ktuner.db", **settings), dict(OWNERS))


def _as(secret: str) -> dict[str, str]:
    return {"cookie": f"kta_owner={secret}"}


def _db(tmp_path: Path, slug: str) -> Path:
    return tmp_path / "owners" / slug / "ktuner.db"


def _upload(client: TestClient, secret: str, example: str = "sep01-0813") -> tuple[str, str]:
    thread = uuid.uuid4().hex
    response = client.post(
        "/upload",
        headers=_as(secret),
        files={"file": (FILE_NAMES[example], owner_csv(example).encode(), "text/csv")},
        data={"threadId": thread},
    )
    assert response.status_code == 200, response.text
    return response.json()["uploadId"], thread


def _drive(client: TestClient, secret: str) -> None:
    """The two calls the chat makes: the upload, then the AG-UI turn that makes it a Drive."""
    upload_id, thread = _upload(client, secret)
    run = uuid.uuid4().hex
    body = {
        "threadId": thread, "runId": run, "state": {"upload_id": upload_id, "thread_id": thread},
        "messages": [{"id": f"h-{run}", "role": "user", "content": f"Uploaded {upload_id}"}],
        "tools": [], "context": [], "forwardedProps": {},
    }
    response = client.post("/agent", json=body, headers={**_as(secret), "accept": "text/event-stream"})
    assert response.status_code == 200 and "RUN_ERROR" not in response.text


def _drives(client: TestClient, secret: str) -> list:
    response = client.get("/api/state", headers=_as(secret))
    assert response.status_code == 200, response.text
    return response.json()["carHistory"]


async def _asgi(gate: O.Owners, method: str, path: str, headers: list[tuple[bytes, bytes]] = ()) -> dict:
    """One request straight at the gate, for what an HTTP client refuses to send."""
    sent: list[dict] = []

    async def receive() -> dict:
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message: dict) -> None:
        sent.append(message)

    scope = {"type": "http", "method": method, "path": path, "headers": list(headers), "scheme": "http", "query_string": b""}
    await gate(scope, receive, send)
    return {"status": sent[0]["status"], "body": b"".join(m.get("body", b"") for m in sent[1:])}


def _fake_create_app(built: list[int], release: asyncio.Event | None = None):
    """A stand-in `create_app`: no worker, a start slow enough to race, a route that can wait."""

    def build(settings, store=None, llm_caller=None):
        built.append(1)

        @asynccontextmanager
        async def lifespan(app):
            await asyncio.sleep(0.01)
            yield

        app = FastAPI(lifespan=lifespan)

        @app.get("/wait")
        async def wait() -> dict:
            if release is not None:
                await release.wait()
            return {}

        return app

    return build


# ----------------------------------------------------- owners can't cross
def test_one_owners_drive_and_chats_never_reach_another_owner(tmp_path):
    gate = _gate(tmp_path)
    with TestClient(gate) as client:
        _drive(client, SECRET_A)
        client.put(f"/api/threads/{uuid.uuid4().hex}", headers=_as(SECRET_A), json={"messages": [{"role": "user", "content": "ann's chat"}], "title": "ann's chat"})

        assert len(_drives(client, SECRET_A)) == 1
        assert "ann's chat" in [t["title"] for t in client.get("/api/threads", headers=_as(SECRET_A)).json()["threads"]]
        assert _drives(client, SECRET_B) == []
        assert client.get("/api/threads", headers=_as(SECRET_B)).json()["threads"] == []

        for stale in ("c" * 30, SECRET_A[:-1], SECRET_A + "x", ""):
            for path in ("/api/state", "/api/threads"):
                assert client.get(path, headers=_as(stale)).status_code == 401

    db_a, db_b = _db(tmp_path, "ann"), _db(tmp_path, "ben")
    assert db_a.exists() and db_b.exists() and not db_a.samefile(db_b)
    assert db_a.with_name("ktuner-chat.db").exists()
    assert not (tmp_path / "ktuner.db").exists()


def test_a_revoked_owners_cookie_reaches_nothing_and_their_data_stays(tmp_path):
    with TestClient(_gate(tmp_path)) as client:
        _upload(client, SECRET_A)
    revoked = O.Owners(Settings(db_path=tmp_path / "ktuner.db"), {"ben": SECRET_B})
    client = TestClient(revoked)
    assert client.get("/api/state", headers=_as(SECRET_A)).status_code == 401
    assert client.post(f"/join/{SECRET_A}").status_code == 404
    assert _db(tmp_path, "ann").exists()


# ----------------------------------------------------- no cookie, nothing
def test_every_route_of_a_real_instance_answers_401_without_the_cookie(tmp_path):
    web = tmp_path / "out"
    web.mkdir()
    (web / "index.html").write_text("<html>chat</html>", encoding="utf-8")
    settings = replace(Settings(), db_path=tmp_path / "probe" / "ktuner.db", web_dir=web)
    routes = [(m, re.sub(r"\{[^}]+\}", "x", r.path)) for r in create_app(settings).routes for m in (getattr(r, "methods", None) or ("GET", "POST"))]
    paths = {p for _, p in routes}
    assert {"/upload", "/agent", "/docs", "/api/state"} <= paths  # the list really is the app's

    gate = _gate(tmp_path, web_dir=web)
    client = TestClient(gate)
    for method, path in [*routes, ("GET", "/"), ("POST", "/agent"), ("GET", "/docs"), ("GET", "/index.html")]:
        if path == "/healthz" and method == "GET":
            continue
        assert client.request(method, path or "/").status_code == 401, (method, path)
    assert gate._instances == {} and not (tmp_path / "owners").exists()


def test_healthz_says_ok_and_nothing_more_with_no_cookie(tmp_path):
    response = TestClient(_gate(tmp_path)).get("/healthz")
    assert (response.status_code, response.text) == (200, "ok")
    assert "set-cookie" not in response.headers


def test_refusals_speak_json_to_the_chat_and_html_to_a_person(tmp_path):
    client = TestClient(_gate(tmp_path))
    for path in ("/api/state", "/upload", "/agent"):
        assert client.get(path).json()["detail"]
    page = client.get("/")
    assert page.headers["content-type"].startswith("text/html") and "invite link" in page.text


@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "//join/{s}"), ("GET", "/JOIN/{s}"), ("GET", "/join/{s}/"), ("GET", "/join/{s}/y"),
        ("POST", "//join/{s}"), ("POST", "/JOIN/{s}"), ("POST", "/join/{s}/"), ("POST", "/join/{s}/y"),
        ("GET", "/healthz/"), ("POST", "/healthz"), ("HEAD", "/healthz"), ("GET", "/HEALTHZ"),
        ("GET", "/../api/state"), ("GET", "/%2e%2e/api/state"), ("GET", "//api/state"), ("GET", "/api/state/"),
        ("HEAD", "/"), ("OPTIONS", "/"), ("OPTIONS", "/api/state"), ("TRACE", "/api/state"), ("DELETE", "/api/threads/x"),
        ("GET", "/join/"), ("GET", "/join"),
    ],
)
def test_a_path_or_method_variant_never_reaches_an_instance(tmp_path, method, path):
    gate = _gate(tmp_path)
    headers = [(b"content-length", b"0")] if method == "POST" else []
    result = asyncio.run(_asgi(gate, method, path.format(s=SECRET_A), headers))
    assert result["status"] == 401
    assert gate._instances == {}


@pytest.mark.parametrize("method", ["HEAD", "OPTIONS", "PUT", "DELETE"])
def test_join_answers_only_get_and_post_and_gives_nothing_away(tmp_path, method):
    gate = _gate(tmp_path)
    good = asyncio.run(_asgi(gate, method, f"/join/{SECRET_A}"))
    bad = asyncio.run(_asgi(gate, method, "/join/wrong"))
    assert good == bad and good["status"] == 404


# ------------------------------------------------------------- the join flow
def test_get_join_shows_the_notice_and_sets_no_cookie(tmp_path):
    response = TestClient(_gate(tmp_path)).get(f"/join/{SECRET_A}")
    assert response.status_code == 200
    assert "Before you start" in response.text and "at your own risk" in response.text
    assert '<form method="post">' in response.text and "I understand, open my car" in response.text
    assert SECRET_A not in response.text
    assert "set-cookie" not in response.headers
    assert response.headers["cache-control"] == "no-store" and response.headers["referrer-policy"] == "no-referrer"


def test_a_wrong_secret_gets_one_404_page_with_no_cookie(tmp_path):
    client = TestClient(_gate(tmp_path))
    got, posted = client.get("/join/not-a-secret"), client.post("/join/not-a-secret")
    assert got.status_code == posted.status_code == 404
    assert got.text == posted.text == client.get("/").text
    assert "set-cookie" not in got.headers and "set-cookie" not in posted.headers


def test_post_join_sets_the_cookie_and_goes_home(tmp_path):
    client = TestClient(_gate(tmp_path), follow_redirects=False)
    response = client.post(f"/join/{SECRET_A}")
    cookie = response.headers["set-cookie"]
    assert response.status_code == 303 and response.headers["location"] == "/"
    assert cookie.startswith(f"kta_owner={SECRET_A};")
    assert "HttpOnly" in cookie and "SameSite=Lax" in cookie and "Max-Age=7776000" in cookie and "Path=/" in cookie
    assert "Secure" not in cookie
    assert response.headers["cache-control"] == "no-store" and response.headers["referrer-policy"] == "no-referrer"
    behind_tls = client.post(f"/join/{SECRET_A}", headers={"x-forwarded-proto": "https"})
    assert "Secure" in behind_tls.headers["set-cookie"]


@pytest.mark.parametrize("site", ["cross-site", "same-site"])
def test_another_sites_form_cannot_sign_a_visitor_in(tmp_path, site):
    client = TestClient(_gate(tmp_path), follow_redirects=False)
    response = client.post(f"/join/{SECRET_A}", headers={"sec-fetch-site": site})
    assert response.status_code == 404 and "set-cookie" not in response.headers
    assert client.post(f"/join/{SECRET_A}", headers={"sec-fetch-site": "same-origin"}).status_code == 303


def test_the_cookie_the_button_set_opens_the_gate(tmp_path):
    gate = _gate(tmp_path)
    with TestClient(gate) as client:
        client.post(f"/join/{SECRET_A}")  # the client keeps the cookie and follows the redirect
        assert list(gate._instances) == ["ann"]
        assert client.get("/api/state").status_code == 200


# ------------------------------------------------------------ startup is closed
@pytest.mark.parametrize(
    "raw",
    [
        None, "", "   ",
        "just-a-secret-with-no-owner-name",
        f"Ann:{SECRET_A}", f"an/n:{SECRET_A}", f":{SECRET_A}", f"{'a' * 33}:{SECRET_A}",
        "ann:short", "ann:", "ann",
        f"ann:{SECRET_A},",
        f"ann:{SECRET_A},ann:{SECRET_B}",
        f"ann:{SECRET_A},ben:{SECRET_A}",
        f"ann:{SECRET_A}\n",
        "ann:" + "x" * 23 + ";",
    ],
)
def test_a_bad_owner_list_stops_the_server_and_never_prints_a_secret(raw):
    with pytest.raises(ValueError) as refused:
        O.parse_owners(raw)
    message = str(refused.value)
    assert "KTA_OWNERS" in message
    for secret in (SECRET_A, SECRET_B, "short", "just-a-secret-with-no-owner-name"):
        assert secret not in message


def test_the_container_entry_point_refuses_to_start_without_owners(monkeypatch):
    monkeypatch.delenv("KTA_OWNERS", raising=False)
    monkeypatch.setattr(O, "_app", None)
    with pytest.raises(ValueError, match="KTA_OWNERS"):
        O.__getattr__("app")


def test_a_good_owner_list_reads_back():
    assert O.parse_owners(f"ann:{SECRET_A},ben:{SECRET_B}") == OWNERS


# ------------------------------------------------------------- the body limit
@pytest.mark.parametrize(
    "headers,status",
    [
        ([(b"content-length", b"20000001")], 413),
        ([(b"content-length", b"9" * 5000)], 413),
        ([], 411),
        ([(b"transfer-encoding", b"chunked")], 411),
        ([(b"transfer-encoding", b"chunked"), (b"content-length", b"5")], 411),
        ([(b"content-length", b"-1")], 400),
        ([(b"content-length", b"+5")], 400),
        ([(b"content-length", b"1_000")], 400),
        ([(b"content-length", b"abc")], 400),
        ([(b"content-length", b"")], 400),
        ([(b"content-length", "٣".encode())], 400),
        ([(b"content-length", b"5"), (b"content-length", b"50000000")], 400),
    ],
)
@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH"])
def test_a_bad_stated_size_is_refused_before_the_app_with_a_valid_cookie(tmp_path, method, headers, status):
    gate = _gate(tmp_path)
    cookie = (b"cookie", f"kta_owner={SECRET_A}".encode())
    result = asyncio.run(_asgi(gate, method, "/upload", [cookie, *headers]))
    assert result["status"] == status and b'"detail"' in result["body"]
    assert gate._instances == {} and not (tmp_path / "owners").exists()


def test_the_too_big_sentence_is_one_an_owner_can_read(tmp_path):
    response = TestClient(_gate(tmp_path)).post("/upload", content=b"x", headers={"content-length": "20000001"})
    assert response.status_code == 413
    assert "20 MB" in response.json()["detail"]


def test_a_normal_upload_passes_the_limit_and_is_stored(tmp_path):
    with TestClient(_gate(tmp_path)) as client:
        upload_id, _ = _upload(client, SECRET_A)
    assert upload_id and _db(tmp_path, "ann").stat().st_size > 0


# -------------------------------------------------------------- the model cap
def test_past_the_cap_no_model_call_happens_and_the_built_in_reply_stands(tmp_path, monkeypatch):
    calls: list[int] = []

    async def fake_post_chat(settings, messages, tools):
        calls.append(1)
        return {"choices": [{"message": {"content": "Plain words from the model."}}]}

    monkeypatch.setattr("kta_server.agent._post_chat", fake_post_chat)
    monkeypatch.setattr(O, "MODEL_CALLS_PER_DAY", 2)
    gate = _gate(tmp_path, **KEYED)
    ask = {"text": "Why is my car slower in the heat?"}

    with TestClient(gate) as client:
        for _ in range(2):  # the front agent, then the suggested replies: past the cap well before the end
            assert client.post("/api/ask", json=ask, headers=_as(SECRET_A)).status_code == 200
        assert len(calls) == 2

        capped = client.post("/api/ask", json=ask, headers=_as(SECRET_A))
        assert len(calls) == 2
        assert capped.status_code == 200
        assert capped.json()["answer"].strip() and capped.json()["ok"]
        assert capped.json()["agent"]["fallback"] == "error"

        # Refused calls were not counted, and another owner has their own budget.
        with sqlite3.connect(_db(tmp_path, "ann")) as c:
            assert c.execute("SELECT calls FROM model_calls").fetchall() == [(2,)]
        assert client.post("/api/ask", json=ask, headers=_as(SECRET_B)).status_code == 200
        assert len(calls) == 4

        # The count lives in the owner's database: a stopped instance forgets nothing.
        client.portal.call(gate.sweep, time.monotonic() + LATER)
        assert gate._instances == {}
        assert client.post("/api/ask", json=ask, headers=_as(SECRET_A)).status_code == 200
        assert len(calls) == 4


def test_with_no_key_nothing_counts(tmp_path):
    gate = _gate(tmp_path)
    with TestClient(gate) as client:
        assert client.post("/api/ask", json={"text": "hello"}, headers=_as(SECRET_A)).status_code == 200
    with sqlite3.connect(_db(tmp_path, "ann")) as c:
        assert c.execute("SELECT COUNT(*) FROM model_calls").fetchone() == (0,)


# -------------------------------------------------------------- the idle stop
def test_an_idle_instance_stops_and_comes_back_with_its_data(tmp_path):
    gate = _gate(tmp_path)
    with TestClient(gate) as client:
        _drive(client, SECRET_A)
        first = gate._instances["ann"]
        worker = first.app.state.worker
        assert worker.running

        client.portal.call(gate.sweep, time.monotonic() + 60)  # not idle long enough
        assert gate._instances["ann"] is first and worker.running

        client.portal.call(gate.sweep, time.monotonic() + LATER)
        assert gate._instances == {} and not worker.running

        assert len(_drives(client, SECRET_A)) == 1
        second = gate._instances["ann"]
        assert second is not first and second.app.state.worker.running


def test_an_instance_with_a_request_in_flight_is_not_stopped(tmp_path, monkeypatch):
    async def scenario() -> None:
        built: list[int] = []
        release = asyncio.Event()
        monkeypatch.setattr(O, "create_app", _fake_create_app(built, release))
        gate = _gate(tmp_path)
        request = asyncio.create_task(_asgi(gate, "GET", "/wait", [(b"cookie", f"kta_owner={SECRET_A}".encode())]))
        while "ann" not in gate._instances or gate._instances["ann"].in_flight == 0:
            assert not request.done(), request
            await asyncio.sleep(0.001)

        await gate.sweep(time.monotonic() + LATER)
        assert "ann" in gate._instances

        release.set()
        assert (await request)["status"] == 200
        assert gate._instances["ann"].in_flight == 0
        await gate.sweep(time.monotonic() + LATER)
        assert gate._instances == {}

    asyncio.run(scenario())


def test_the_sweep_stops_every_instance_at_shutdown(tmp_path):
    gate = _gate(tmp_path)
    with TestClient(gate) as client:
        assert client.get("/api/state", headers=_as(SECRET_A)).status_code == 200
        worker = gate._instances["ann"].app.state.worker
    assert not worker.running and gate._instances == {}


# ------------------------------------------------------- two first requests
def test_two_simultaneous_first_requests_build_one_instance(tmp_path, monkeypatch):
    async def scenario() -> None:
        built: list[int] = []
        monkeypatch.setattr(O, "create_app", _fake_create_app(built))
        gate = _gate(tmp_path)
        first, second = await asyncio.gather(gate._enter("ann"), gate._enter("ann"))
        assert first is second and first.in_flight == 2 and len(built) == 1

    asyncio.run(scenario())


# --------------------------------------------------------- what the gate ignores
@pytest.mark.parametrize("header", ['kta_owner="unterminated', "===;;;", "kta_owner", "a=b; c", "\x00bad"])
def test_a_malformed_cookie_header_is_no_cookie(tmp_path, header):
    gate = _gate(tmp_path)
    cookie = (b"cookie", header.encode("latin-1"))
    assert asyncio.run(_asgi(gate, "GET", "/", [cookie]))["status"] == 401


def test_a_websocket_is_closed_before_it_opens(tmp_path):
    sent: list[dict] = []

    async def send(message: dict) -> None:
        sent.append(message)

    asyncio.run(_gate(tmp_path)({"type": "websocket", "path": "/agent", "headers": []}, None, send))
    assert sent == [{"type": "websocket.close", "code": 1008}]
