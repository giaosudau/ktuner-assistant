"""The harness steps the owner can expand (ADR 0004 §"AG-UI").

Every step is one engine call, streamed as AG-UI `TOOL_CALL_START`,
`TOOL_CALL_ARGS`, `TOOL_CALL_END` and `TOOL_CALL_RESULT` — so the collapsed line
"Checked N things · X s" expands to each step's inputs and outputs and the owner
can check the work.

Two rules that make the line trustworthy:

* **Inputs are redacted by construction.** `Harness.step` takes the `inputs` to
  *show* separately from the arguments to *call* with, so a raw CSV can never
  ride out on an event. A Drive is described by its file name and byte count.
* **The count and the seconds are measured here**, not in the browser, so the
  line says what the server actually did.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Mapping

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig

# ag_ui_langgraph's CustomEventNames.ManuallyEmitMessage.
MANUALLY_EMIT_MESSAGE = "manually_emit_message"
# Our own advisory event: the collapsed harness summary.
HARNESS_SUMMARY = "harness"


def _manager(config: RunnableConfig | None):
    """The callback manager this node runs under, so events reach the SSE stream."""
    cbs = (config or {}).get("callbacks") or []
    if hasattr(cbs, "on_custom_event"):
        return cbs
    from langchain_core.callbacks import AsyncCallbackManager

    return AsyncCallbackManager(cbs)


@dataclass
class Step:
    """One checked thing, as the owner sees it."""

    name: str
    title: str
    inputs: dict[str, Any]
    output: dict[str, Any]
    ms: int

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "title": self.title,
            "inputs": self.inputs,
            "output": self.output,
            "ms": self.ms,
        }


@dataclass
class Harness:
    """Collects the steps of one run and streams each as it happens."""

    steps: list[Step] = field(default_factory=list)

    @property
    def seconds(self) -> float:
        return round(sum(s.ms for s in self.steps) / 1000.0, 1)

    @property
    def checked(self) -> int:
        return len(self.steps)

    def summary(self) -> dict[str, Any]:
        return {"checked": self.checked, "seconds": self.seconds, "line": f"Checked {self.checked} things · {self.seconds:.1f} s"}

    def as_list(self) -> list[dict[str, Any]]:
        return [s.as_dict() for s in self.steps]

    async def step(
        self,
        config: RunnableConfig | None,
        name: str,
        title: str,
        inputs: Mapping[str, Any],
        call: Callable[[], Awaitable[Any]],
    ) -> Any:
        """Run one engine call, streaming its name, inputs and output.

        `inputs` is what the owner sees; `call` is what actually runs, and may
        carry things that must never leave the process (the raw CSV).
        """
        cm = _manager(config)
        shown = dict(inputs)
        started = time.perf_counter()
        result = await call()
        ms = int((time.perf_counter() - started) * 1000)
        output = _slim(result if isinstance(result, dict) else {"result": result})
        run = await cm.on_tool_start({"name": name, "args": shown}, title, name=name, inputs=shown)
        await run.on_tool_end(ToolMessage(content=json.dumps(output, default=str), name=name, tool_call_id=str(run.run_id)))
        self.steps.append(Step(name=name, title=title, inputs=shown, output=output, ms=ms))
        return result

    async def say(self, config: RunnableConfig | None, message_id: str, text: str) -> None:
        """Stream one paragraph of the reply as TEXT_MESSAGE_*."""
        cm = _manager(config)
        await cm.on_custom_event(MANUALLY_EMIT_MESSAGE, {"message_id": message_id, "message": text})

    async def think(self, config: RunnableConfig | None, message_id: str, text: str) -> None:
        """Stream the model's own thinking as its own collapsed block.

        Labelled "unchecked" and never mixed into the harness steps: it is what
        the model said to itself, not a checked fact (ADR 0004 §AG-UI).
        """
        cm = _manager(config)
        await cm.on_custom_event("thinking", {"message_id": message_id, "thinking": text, "label": "unchecked"})

    async def summary_event(self, config: RunnableConfig | None, summary: Mapping[str, Any] | None = None) -> None:
        """The collapsed harness line, once every step is in."""
        cm = _manager(config)
        await cm.on_custom_event(HARNESS_SUMMARY, dict(summary) if summary else self.summary())


def merge(parts: list[Mapping[str, Any] | None]) -> dict[str, Any]:
    """One harness summary out of several nodes' steps.

    The line has to say what the whole run checked, so the count and the seconds
    are added up where the line is drawn rather than per node.
    """
    steps = [s for part in parts if part for s in (part.get("steps") or [])]
    seconds = round(sum(float(s.get("ms") or 0) for s in steps) / 1000.0, 1)
    return {
        "checked": len(steps),
        "seconds": seconds,
        "line": f"Checked {len(steps)} things · {seconds:.1f} s",
        "steps": steps,
    }


def _slim(value: Any, depth: int = 0) -> Any:
    """Compact summaries only: drop long free text and arrays of numbers."""
    if depth > 6:
        return "…"
    if isinstance(value, Mapping):
        return {str(k): _slim(v, depth + 1) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        if len(value) > 24:
            return [_slim(v, depth + 1) for v in value[:24]] + [f"… and {len(value) - 24} more"]
        return [_slim(v, depth + 1) for v in value]
    if isinstance(value, str) and len(value) > 4000:
        return value[:4000] + "…"
    return value


__all__ = ["Harness", "Step", "HARNESS_SUMMARY", "MANUALLY_EMIT_MESSAGE", "merge"]