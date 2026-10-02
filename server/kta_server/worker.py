"""The Python side of the worker protocol (ADR 0002, ADR 0004 §"the worker protocol").

One long-lived Node process per server. Newline-delimited JSON both ways:

    → {"id":"7","op":"ingestUpload","args":{"csv":"<text>", ...}}
    ← {"id":"7","ok":true,"result":{...}}
    ← {"id":"7","ok":false,"error":{"message":"…","code":"…"}}

Nothing here parses a log, judges a drive or invents a number: every fact a
reply can show came out of the engine through this channel.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from .config import WORKER_SCRIPT


class WorkerError(RuntimeError):
    """An engine call that failed. `code` is the worker's, never a stack trace."""

    def __init__(self, message: str, code: str = "internal") -> None:
        super().__init__(message)
        self.code = code
        self.message = message

    def as_dict(self) -> dict[str, str]:
        return {"message": self.message, "code": self.code}


class Worker:
    """A single long-lived `node server/kta_worker/worker.js`."""

    def __init__(self, script: Path | str = WORKER_SCRIPT, node_exe: str = "node") -> None:
        self.script = Path(script)
        self.node_exe = node_exe
        self._proc: asyncio.subprocess.Process | None = None
        self._reader: asyncio.Task | None = None
        self._pending: dict[str, asyncio.Future] = {}
        self._next_id = 0
        self._lock = asyncio.Lock()
        self.limits: dict[str, Any] = {}
        self.ktuner_basemap: str = "Starter 21 Dual Tune 2"

    # -- lifecycle ---------------------------------------------------------
    @property
    def running(self) -> bool:
        """True once the Node process is up."""
        return self._proc is not None and self._proc.returncode is None

    async def start(self) -> None:
        if self._proc is not None:
            return
        if not self.script.exists():
            raise WorkerError(f"The engine worker is not there: {self.script}", "worker-missing")
        self._proc = await asyncio.create_subprocess_exec(
            self.node_exe,
            str(self.script),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self.script.resolve().parents[2]),
        )
        self._reader = asyncio.create_task(self._read_loop())
        ping = await self.call("ping")
        self.limits = ping.get("limits") or {}
        self.ktuner_basemap = ping.get("ktunerBasemap") or self.ktuner_basemap

    async def aclose(self) -> None:
        proc, self._proc = self._proc, None
        if proc is None:
            return
        try:
            if proc.stdin and not proc.stdin.is_closing():
                proc.stdin.close()
            proc.terminate()
            await asyncio.wait_for(proc.wait(), timeout=5)
        except (ProcessLookupError, asyncio.TimeoutError, BrokenPipeError):
            try:
                proc.kill()
            except ProcessLookupError:
                pass
        finally:
            if self._reader:
                self._reader.cancel()
            for fut in self._pending.values():
                if not fut.done():
                    fut.set_exception(WorkerError("The engine worker stopped.", "worker-gone"))
            self._pending.clear()

    async def __aenter__(self) -> "Worker":
        await self.start()
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.aclose()

    # -- the protocol ------------------------------------------------------
    async def call(self, op: str, **args: Any) -> Any:
        await self.start()
        assert self._proc is not None and self._proc.stdin is not None
        async with self._lock:
            self._next_id += 1
            rid = str(self._next_id)
            fut: asyncio.Future = asyncio.get_running_loop().create_future()
            self._pending[rid] = fut
            payload = json.dumps({"id": rid, "op": op, "args": args}, default=str)
            try:
                self._proc.stdin.write(payload.encode("utf-8") + b"\n")
                await self._proc.stdin.drain()
            except (BrokenPipeError, ConnectionResetError) as exc:
                self._pending.pop(rid, None)
                raise WorkerError("The engine worker is not answering.", "worker-gone") from exc
        return await asyncio.wait_for(fut, timeout=180)

    async def _read_loop(self) -> None:
        assert self._proc is not None and self._proc.stdout is not None
        loop = asyncio.get_running_loop()
        stderr_task = asyncio.create_task(self._drain_stderr())
        try:
            while True:
                line = await self._proc.stdout.readline()
                if not line:
                    break
                try:
                    msg = json.loads(line)
                except json.JSONDecodeError:
                    continue  # stdout carries the protocol only; skip noise
                fut = self._pending.pop(str(msg.get("id")), None)
                if fut is None or fut.done():
                    continue
                loop.call_soon_threadsafe(_settle, fut, msg)
        except asyncio.CancelledError:  # pragma: no cover - shutdown path
            raise
        finally:
            stderr_task.cancel()
            for fut in self._pending.values():
                if not fut.done():
                    loop.call_soon_threadsafe(
                        fut.set_exception, WorkerError("The engine worker stopped.", "worker-gone")
                    )

    async def _drain_stderr(self) -> None:  # pragma: no cover - noise only
        assert self._proc is not None and self._proc.stderr is not None
        while True:
            line = await self._proc.stderr.readline()
            if not line:
                return
            print("[engine worker]", line.decode("utf-8", "replace").rstrip(), flush=True)


def _settle(fut: asyncio.Future, msg: dict[str, Any]) -> None:
    if msg.get("ok"):
        fut.set_result(msg.get("result"))
    else:
        err = msg.get("error") or {}
        fut.set_exception(
            WorkerError(str(err.get("message") or "The engine call failed."), str(err.get("code") or "internal"))
        )


__all__ = ["Worker", "WorkerError"]