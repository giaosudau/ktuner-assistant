"""The model client: the one place the provider is called (ADR 0005, AD-5).

Any OpenAI-compatible endpoint from `.env`. The key rides only the `Authorization` header from here
to the provider. The model orchestrates and never decides; callers keep their own prompt, tool table,
tool loop and `verify.py` check, and on any failure here they fall back to the built-in reply.
"""

from __future__ import annotations

import json
import re
from typing import Any, Awaitable, Callable, Mapping

import httpx

Message = dict[str, Any]
#: `async (messages, tools) -> response_json`. Overridden in tests with a scripted fake so no test
#: needs a network or a key.
Caller = Callable[[list[Message], list[dict[str, Any]]], Awaitable[dict[str, Any]]]


def tool(name: str, description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    """One function-tool schema."""
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {"type": "object", "properties": properties, "required": required, "additionalProperties": False},
        },
    }


async def post_chat(settings: Any, messages: list[Message], tools: list[dict[str, Any]], timeout: float = 120) -> dict[str, Any]:
    base = str(settings.llm_base_url or "").rstrip("/")
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{base}/chat/completions",
            headers={"authorization": f"Bearer {settings.llm_api_key}", "content-type": "application/json"},
            json={"model": settings.llm_model, "messages": messages} | ({"tools": tools, "tool_choice": "auto"} if tools else {}),
        )
        response.raise_for_status()
        return response.json()


def caller_for(settings: Any, llm_caller: Caller | None = None) -> Caller:
    """The test's scripted caller, else the provider. `post_chat` is looked up at call time so a test can patch it."""
    return llm_caller or (lambda msgs, tls: post_chat(settings, msgs, tls))


def message_of(response: dict[str, Any]) -> dict[str, Any]:
    choices = response.get("choices") or []
    if not choices:
        raise ValueError("The model returned no choices.")
    return dict(choices[0].get("message") or {})


def extract_thinking(message: Mapping[str, Any]) -> str | None:
    """The model's own thinking, kept apart and labelled unchecked downstream."""
    parts: list[str] = []
    for key in ("reasoning_content", "thinking"):
        value = message.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())
        elif isinstance(value, list):
            for block in value:
                text = block.get("thinking") if isinstance(block, Mapping) else None
                if text:
                    parts.append(str(text).strip())
    content = message.get("content") or ""
    for match in re.finditer(r"<think>(.*?)</think>", str(content), re.DOTALL):
        if match.group(1).strip():
            parts.append(match.group(1).strip())
    return "\n\n".join(parts) or None


def strip_thinking(content: Any) -> Any:
    """Thinking tags are shown in their own block, never inside the prose."""
    if not isinstance(content, str):
        return content
    return re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL)


def tool_calls_of(message: Mapping[str, Any]) -> list[dict[str, Any]]:
    out = []
    for call in message.get("tool_calls") or []:
        fn = (call.get("function") or {}) if isinstance(call, Mapping) else {}
        raw_args = fn.get("arguments")
        if isinstance(raw_args, str):
            try:
                parsed = json.loads(raw_args) if raw_args.strip() else {}
            except ValueError:
                parsed = {"_unparseable": raw_args}
        else:
            parsed = dict(raw_args or {})
        out.append({"id": call.get("id"), "name": fn.get("name"), "args": parsed})
    return out


def wrap(value: Any) -> Any:
    """A finished value as the awaitable `harness.step` runs."""

    async def call() -> Any:
        return value

    return call


__all__ = [
    "Caller", "Message", "caller_for", "extract_thinking", "message_of", "post_chat", "strip_thinking", "tool", "tool_calls_of", "wrap",
]
