"use client";

/**
 * One upload, one streamed reply.
 *
 * The browser never reads a log: it posts the CSV to `POST /upload` (which
 * stores the raw file server-side), then runs one AG-UI turn with the upload id
 * in `state`. Everything drawn in the thread comes from that turn's events:
 * TOOL_CALL_* for the harness steps, TEXT_MESSAGE_* for the prose, and the
 * STATE_SNAPSHOT's typed `reply` for the cards.
 */

import {
  HttpAgent,
  type CustomEvent,
  type RunErrorEvent,
  type StateSnapshotEvent,
  type TextMessageContentEvent,
  type ToolCallArgsEvent,
  type ToolCallResultEvent,
  type ToolCallStartEvent,
} from "@ag-ui/client";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  AGENT_URL,
  SERVER_URL,
  type HarnessSummary,
  type HarnessStep,
  type LoopState,
  type ReplyCard,
  type Turn,
} from "./types";

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;

export async function uploadCsv(
  file: File,
  threadId: string,
): Promise<{ uploadId: string; fileName: string; bytes: number }> {
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("threadId", threadId);
  const response = await fetch(`${SERVER_URL}/upload`, { method: "POST", body });
  if (!response.ok) throw new Error(`The upload did not go through (${response.status}).`);
  return (await response.json()) as { uploadId: string; fileName: string; bytes: number };
}

export function useThread() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const threadId = useMemo(() => nextId("thread"), []);
  const running = useRef(false);

  const patch = useCallback(
    (id: string, change: Partial<Turn> | ((prev: Turn) => Partial<Turn>)) => {
      setTurns((all) =>
        all.map((t) =>
          t.id === id ? { ...t, ...(typeof change === "function" ? change(t) : change) } : t,
        ),
      );
    },
    [],
  );

  const send = useCallback(
    async (file: File) => {
      if (running.current) return;
      const turnId = nextId("turn");
      setTurns((all) => [
        ...all,
        { id: turnId, fileName: file.name, running: true, card: null, harness: null, lines: [] },
      ]);
      setBusy(true);
      running.current = true;

      try {
        const { uploadId } = await uploadCsv(file, threadId);

        const order: string[] = [];
        const open: Map<
          string,
          { name: string; title: string; args: string; output?: unknown; done: boolean }
        > = new Map();
        const lines: string[] = [];
        let harness: HarnessSummary | null = null;
        let card: ReplyCard | null = null;
        let failure: string | undefined;

        const steps = (): HarnessStep[] =>
          order.flatMap((id) => {
            const s = open.get(id);
            if (!s) return [];
            return [
              {
                name: s.name,
                title: s.title || s.name,
                inputs: safeJson(s.args),
                output: s.done ? s.output : { pending: true },
                ms: 0,
              },
            ];
          });

        const agent = new HttpAgent({
          url: AGENT_URL,
          agentId: "kta-tune-assist",
          threadId,
          description: "Civic FE Tune Assist",
          initialState: { upload_id: uploadId, thread_id: threadId } as LoopState,
        });
        agent.addMessage({
          id: nextId("m"),
          role: "user",
          content: `Uploaded ${file.name}`,
        });

        const finish = () => {
          patch(turnId, {
            running: false,
            card,
            harness: harness ?? (card?.harness ? { ...card.harness, steps: steps() } : null),
            lines: lines.length ? [...lines] : card ? [card.say, card.window] : [],
            error: failure ?? card?.error?.message,
          });
        };

        agent.subscribe({
          onEvent({ event }) {
            switch (event.type) {
              case "TEXT_MESSAGE_CONTENT": {
                const { delta } = event as TextMessageContentEvent;
                if (delta) {
                  lines.push(delta);
                  patch(turnId, { lines: [...lines] });
                }
                break;
              }
              case "TOOL_CALL_START": {
                const e = event as ToolCallStartEvent;
                order.push(e.toolCallId);
                open.set(e.toolCallId, { name: e.toolCallName, title: e.toolCallName, args: "", done: false });
                break;
              }
              case "TOOL_CALL_ARGS": {
                const e = event as ToolCallArgsEvent;
                const s = open.get(e.toolCallId);
                if (s) s.args += e.delta;
                break;
              }
              case "TOOL_CALL_RESULT": {
                const e = event as ToolCallResultEvent;
                const s = open.get(e.toolCallId);
                if (s) {
                  s.output = safeJson(typeof e.content === "string" ? e.content : JSON.stringify(e.content));
                  s.done = true;
                }
                patch(turnId, (prev) => ({
                    harness: {
                      checked: order.length,
                      seconds: prev.harness?.seconds ?? 0,
                      line: prev.harness?.line ?? "",
                      steps: steps(),
                    },
                  }));
                break;
              }
              case "CUSTOM": {
                const e = event as CustomEvent;
                if (e.name === "harness") {
                  harness = { ...(e.value as HarnessSummary), steps: steps() };
                  patch(turnId, { harness });
                }
                break;
              }
              case "STATE_SNAPSHOT": {
                const snapshot = (event as StateSnapshotEvent).snapshot as LoopState | undefined;
                if (snapshot?.reply) {
                  card = snapshot.reply as ReplyCard;
                  patch(turnId, { card });
                }
                break;
              }
              case "RUN_ERROR": {
                failure = (event as RunErrorEvent).message;
                break;
              }
              default:
                break;
            }
          },
          onRunFinalized: finish,
          onRunFailed: ({ error }) => {
            failure = error.message;
            finish();
          },
        });

        await agent.runAgent({ runId: nextId("run"), tools: [], context: [], forwardedProps: {} });
        finish();
      } catch (error) {
        patch(turnId, { running: false, error: (error as Error).message });
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [patch, threadId],
  );

  return { turns, busy, threadId, send };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return { text };
  }
}