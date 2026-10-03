"""A KTuner screenshot in the chat (ticket 15): read only by the checked agent, never guessed.

The built-in reply reads no pictures. So with no model key a screenshot gets a
plain answer that says why and what to do instead. With a key the model may
look at the picture, but it still sees the Drive only through the tools and the
same `verify.py` judges its words: a number read off the screenshot is not a tool
number, so it is rejected, and a draft that cannot pass falls back to the plain
answer. A picture is never turned into a value the app uses.
"""

from __future__ import annotations

import base64
from typing import Any

from . import agent as agent_node
from . import copy as C
from . import window as W
from .harness import Harness

PLAIN_NO_KEY = (
    "I can't read pictures without the model, and none is set up here. Type the values you see in the picture, "
    "or use the KTuner card in your Next step. Nothing changes in your map."
)
PLAIN_UNCHECKED = (
    "I couldn't check what I read from that picture against your Drives, and I never quote numbers I can't check. "
    "Type the values you see, or use the KTuner card in your Next step. Nothing changes in your map."
)
PLAIN_NO_DRIVE = (
    "I read a picture against your Drives, and none is uploaded yet. Upload a Drive first, or type the values you see. "
    "Nothing changes in your map."
)
ASK = "The owner attached a KTuner screenshot. Say what it shows in plain words; quote numbers only from the tools."
IMAGE_TYPES = ("image/png", "image/jpeg", "image/webp")
MAX_BYTES = 6_000_000


async def answer_screenshot(
    raw: bytes, mime: str, text: str, worker: Any, store: Any, settings: Any, latest_id: str | None, llm_caller: Any = None
) -> dict[str, Any]:
    out: dict[str, Any] = {"ok": True, "kind": "picture", "citations": [], "pictures": [], "nextStep": None}
    if not settings.has_llm:
        return {**out, "kind": "picture-unread", "answer": PLAIN_NO_KEY, "why": "no-model"}

    state = store.car_state(None) or {}
    if not state.get("drives") or latest_id is None:
        return {**out, "kind": "picture-unread", "answer": PLAIN_NO_DRIVE, "why": "no-drive"}

    installs = store.list_installs()
    win = W.window_for_state(state, installs, latest_id)
    window_state = W.windowed_state(state, win["ids"])
    plan = await worker.call("flashPlan", state=window_state, now=settings.now_ms())
    decided = await worker.call(
        "nextStep", state=window_state, driveId=latest_id, openSteps=store.list_open_steps(), installs=installs
    )
    step = C.next_step_card(decided["step"], plan, worker.limits, decided["openSteps"])
    out["window"] = C.window_card(win)["line"]
    drive = {"id": latest_id, "summary": (state.get("drives") or {}).get(latest_id), "map": None}
    reply = {"say": PLAIN_UNCHECKED, "window": out["window"], "nextStep": step, "flashPlan": plan}
    image = f"data:{mime};base64,{base64.b64encode(raw).decode('ascii')}"
    try:
        result = await agent_node.run_agent(
            drive, reply, worker, store, settings, Harness(), None, llm_caller, question=text or ASK, image=image
        )
    except Exception as exc:  # noqa: BLE001 - the explainer never breaks an answer
        result = {"verified": False, "fallback": "error", "issues": [str(exc)]}
    verified = bool(result.get("verified") and result.get("prose"))
    out["answer"] = result["prose"] if verified else PLAIN_UNCHECKED
    out["pictures"] = (result.get("pictures") or []) if verified else []
    out["citations"] = (result.get("citations") or []) if verified else []
    out["nextStep"] = step.get("title") if step else None
    out["agent"] = {"verified": verified, "fallback": result.get("fallback"), "issues": list(result.get("issues") or [])}
    return out


__all__ = ["IMAGE_TYPES", "MAX_BYTES", "answer_screenshot"]
