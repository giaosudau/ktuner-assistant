"""The built chat is served by the API on one origin (KTA_WEB_DIR), and never shadows an API route."""

from __future__ import annotations

from dataclasses import replace

from fastapi.testclient import TestClient

from kta_server.app import create_app
from kta_server.config import Settings

MARKER = "chat-page-marker"


def _client(tmp_path, with_web: bool) -> TestClient:
    web = tmp_path / "out"
    web.mkdir()
    (web / "index.html").write_text(f"<html>{MARKER}</html>", encoding="utf-8")
    settings = replace(Settings(), db_path=tmp_path / "ktuner.db", web_dir=web if with_web else None)
    return TestClient(create_app(settings))  # no `with`: the worker is not started


def test_the_chat_page_is_served_at_the_root(tmp_path):
    assert MARKER in _client(tmp_path, True).get("/").text


def test_api_routes_still_answer_when_the_chat_is_served(tmp_path):
    client = _client(tmp_path, True)
    health = client.get("/healthz")
    assert health.text in ("ok", "worker-down")
    state = client.get("/api/state")
    assert MARKER not in state.text
    assert state.headers["content-type"].startswith("application/json")


def test_without_a_web_dir_the_root_is_not_found(tmp_path):
    assert _client(tmp_path, False).get("/").status_code == 404
