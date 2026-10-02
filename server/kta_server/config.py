"""Where the pieces live and how they are configured (ADR 0004 §Configuration).

Read once at startup. With no key the loop still works: every reply is the
built-in one, templated from the engine's facts.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# server/kta_server/config.py -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = REPO_ROOT / "server"
WORKER_SCRIPT = SERVER_ROOT / "kta_worker" / "worker.js"


def _load_env() -> None:
    # A .env in the repo root is the developer's; never a tracked file.
    load_dotenv(REPO_ROOT / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    """The whole configuration surface. Every field has a working default."""

    db_path: Path = SERVER_ROOT / "ktuner.db"
    worker_script: Path = WORKER_SCRIPT
    node_exe: str = "node"
    llm_base_url: str | None = None
    llm_api_key: str | None = None
    llm_model: str | None = None
    llm_models: tuple[str, ...] = field(default_factory=tuple)
    #: Fix the clock so the same Drive always gives the same reply in tests.
    now: int | None = None
    #: Browsers the chat may come from. Local-first, no cookies, no auth.
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    )

    @property
    def has_llm(self) -> bool:
        return bool(self.llm_api_key and self.llm_base_url and self.llm_model)

    def now_ms(self) -> int:
        return self.now if self.now is not None else int(__import__("time").time() * 1000)


def _path(name: str, fallback: Path) -> Path:
    raw = os.environ.get(name)
    if not raw:
        return fallback
    p = Path(raw).expanduser()
    # A relative KTA_DB is written against the repo root, as ADR 0004 spells it.
    return p if p.is_absolute() else (REPO_ROOT / p)


def load_settings() -> Settings:
    _load_env()
    models = tuple(m.strip() for m in (os.environ.get("KTA_LLM_MODELS") or "").split(",") if m.strip())
    origins = tuple(
        o.strip() for o in (os.environ.get("KTA_CORS_ORIGINS") or "").split(",") if o.strip()
    ) or Settings.__dataclass_fields__["cors_origins"].default
    raw_now = os.environ.get("KTA_NOW")
    return Settings(
        db_path=_path("KTA_DB", SERVER_ROOT / "ktuner.db"),
        worker_script=_path("KTA_WORKER", WORKER_SCRIPT),
        node_exe=os.environ.get("KTA_NODE") or "node",
        llm_base_url=os.environ.get("KTA_LLM_BASE_URL") or None,
        llm_api_key=os.environ.get("KTA_LLM_API_KEY") or None,
        llm_model=os.environ.get("KTA_LLM_MODEL") or None,
        llm_models=models,
        now=int(raw_now) if raw_now and raw_now.isdigit() else None,
        cors_origins=origins,
    )


__all__ = ["REPO_ROOT", "SERVER_ROOT", "WORKER_SCRIPT", "Settings", "load_settings"]