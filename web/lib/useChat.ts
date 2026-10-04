"use client";

/**
 * The conversation: every thing the owner does is a message, and every answer is
 * the assistant's next message.
 *
 *   CSV attached   → POST /upload, then one AG-UI run → a Drive reply that streams
 *   image attached → POST /api/screenshot
 *   words          → POST /api/ask/stream: the front desk answers a greeting, a car
 *                    change or "what can you do"; words about a car fill the one
 *                    car editor; anything else goes to the tuner
 *   a chip         → POST /api/answer, /api/flash/*
 *
 * Chats are kept on the server (SQLite) and listed in the sidebar like any chat
 * app; this browser remembers only which chat is open. The Car file (profile,
 * history, Map versions, answers) lives on the server too, and is re-read after
 * every turn so the sidebar mirrors the loop. No chat ever holds a car fact.
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
import { useCallback, useEffect, useRef, useState } from "react";

import * as api from "./api";
import { UI_TOOLS } from "./uiTools";
import { AGENT_URL, type CarProfile, type HarnessStep, type HarnessSummary, type OwnerQuestion, type ProfileDraft, type ReplyCard, type Turn } from "./types";

export type FileRef = { name: string; kind: "csv" | "image"; size: number; thumb?: string; tags?: api.LogTags };
export type UserMsg = { id: string; role: "user"; text: string; file?: FileRef };
export type AiMsg = {
  id: string;
  role: "assistant";
  kind: "drive" | "ask" | "profile" | "note" | "answer" | "flash";
  pending?: boolean;
  error?: string;
  /** drive */
  turn?: Turn;
  /** ask */
  answer?: api.AskAnswer;
  /** profile: the one car editor in the thread. `rev` remounts it when the draft is replaced. */
  draft?: ProfileDraft;
  saved?: string;
  rev?: number;
  /** note */
  text?: string;
  detail?: string;
  guide?: boolean;
  /** answer */
  result?: api.AnswerResult;
  driveId?: string;
  /** flash */
  outcome?: api.FlashOutcome;
  /** a Flash card in this message was acted on: what the owner said */
  acted?: string;
  /** the tool the tuner is running right now, while a typed answer streams */
  live?: string;
  liveCount?: number;
};
export type Msg = UserMsg | AiMsg;

/** The chat that was open, so a reload comes back to it (the chats themselves live on the server). */
const CURRENT = "kta-chat-current";
/** Where earlier builds kept the one chat, in this browser only: moved to the server once. */
const LEGACY = "kta-chat-v1";
let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;

/** A turn cut off by a reload can't resume: say so instead of spinning forever. */
function settle(messages: Msg[]): Msg[] {
  return messages.map((m) =>
    m.role === "assistant" && (m.pending || m.turn?.running)
      ? { ...m, pending: false, turn: m.turn ? { ...m.turn, running: false, live: undefined } : m.turn, error: m.error ?? "Interrupted by a reload. Send it again." }
      : m,
  );
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private window: the open chat is forgotten on reload, the chats stay on the server */
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return { text };
  }
}

const sizeOf = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
export { sizeOf };

export function useChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loop, setLoop] = useState<api.LoopState | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [chats, setChats] = useState<api.ChatRow[]>([]);
  const [chatId, setChatId] = useState<string>("");
  /** The message to bring into view (the one car editor when "Edit car" is pressed again). */
  const [focus, setFocus] = useState<{ id: string; at: number } | null>(null);
  const threadId = useRef(nextId("thread"));
  const running = useRef(false);

  // --------------------------------------------------------------- persistence
  const refreshChats = useCallback(async () => setChats(await api.listChats()), []);
  useEffect(() => {
    void (async () => {
      // An earlier build kept the one chat in this browser: move it to the server once.
      const legacy = readLocal(LEGACY);
      if (legacy) {
        try {
          const old = JSON.parse(legacy) as { threadId: string; messages: Msg[] };
          if (old?.threadId && old.messages?.length) {
            await api.saveChat(old.threadId, settle(old.messages));
            writeLocal(CURRENT, old.threadId);
          }
          writeLocal(LEGACY, null);
        } catch {
          /* unreadable: nothing to move */
        }
      }
      const open = readLocal(CURRENT);
      if (open) {
        const chat = await api.readChat<Msg>(open);
        if (chat) {
          threadId.current = chat.id;
          setMessages(settle(chat.messages));
        }
      }
      setChatId(threadId.current);
      setReady(true);
      void refreshChats();
    })();
  }, [refreshChats]);
  // Saved after every change: at once when a turn is done, a moment later while a reply streams
  // (so it isn't written on every token), and once more as the page goes away.
  const latest = useRef<{ id: string; messages: Msg[] }>({ id: "", messages: [] });
  useEffect(() => {
    if (!ready) return;
    writeLocal(CURRENT, threadId.current);
    if (!messages.length) return;
    const id = threadId.current;
    latest.current = { id, messages };
    const timer = setTimeout(
      () => {
        void api.saveChat(id, messages).then(refreshChats).catch((e) => console.warn("This chat was not saved:", e));
      },
      busy ? 600 : 0,
    );
    return () => clearTimeout(timer);
  }, [messages, ready, busy, refreshChats]);
  useEffect(() => {
    const flush = () => {
      const { id, messages: last } = latest.current;
      if (id && last.length) api.saveChatOnLeave(id, last);
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const refresh = useCallback(async () => setLoop(await api.readLoop()), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ------------------------------------------------------------------ helpers
  const add = useCallback((...more: Msg[]) => setMessages((all) => [...all, ...more]), []);
  const patch = useCallback((id: string, change: Partial<AiMsg> | ((prev: AiMsg) => Partial<AiMsg>)) => {
    setMessages((all) =>
      all.map((m) => (m.id === id && m.role === "assistant" ? { ...m, ...(typeof change === "function" ? change(m) : change) } : m)),
    );
  }, []);
  const patchTurn = useCallback(
    (id: string, change: Partial<Turn>) => patch(id, (prev) => ({ turn: { ...(prev.turn as Turn), ...change } })),
    [patch],
  );

  /** Run one guarded turn: one at a time, like every chat app. */
  const guard = useCallback(async (work: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await work();
    } finally {
      running.current = false;
      setBusy(false);
      void refresh();
    }
  }, [refresh]);

  // ---------------------------------------------------------------- a Drive
  const runDrive = useCallback(
    async (file: File, text: string, msgId: string, tags?: api.LogTags) => {
      try {
        const { uploadId } = await api.uploadCsv(file, threadId.current, tags);
        const order: string[] = [];
        const open = new Map<string, { name: string; args: string; output?: unknown; done: boolean }>();
        const lines: string[] = [];
        let harness: HarnessSummary | null = null;
        let card: ReplyCard | null = null;
        let failure: string | undefined;
        let thinking = "";
        const started = Date.now();

        const steps = (): HarnessStep[] =>
          order.flatMap((id) => {
            const s = open.get(id);
            return s ? [{ name: s.name, title: s.name, inputs: safeJson(s.args), output: s.done ? s.output : { pending: true }, ms: 0 }] : [];
          });

        const agent = new HttpAgent({
          url: AGENT_URL,
          agentId: "kta-tune-assist",
          threadId: threadId.current,
          description: "KTuner Assistant",
          initialState: { upload_id: uploadId, thread_id: threadId.current },
        });
        agent.addMessage({ id: nextId("m"), role: "user", content: text || `Uploaded ${file.name}` });

        const finish = () => {
          const fromCard = card?.harness?.steps?.length ? card.harness : null;
          patchTurn(msgId, {
            running: false,
            live: undefined,
            card,
            harness: fromCard ?? harness ?? (order.length ? { checked: order.length, seconds: (Date.now() - started) / 1000, line: "", steps: steps() } : null),
            lines: lines.length ? [...lines] : card ? [card.say, card.window] : [],
            thinking: thinking || card?.agent?.thinking || undefined,
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
                  patchTurn(msgId, { lines: [...lines] });
                }
                break;
              }
              case "TOOL_CALL_START": {
                const e = event as ToolCallStartEvent;
                order.push(e.toolCallId);
                open.set(e.toolCallId, { name: e.toolCallName, args: "", done: false });
                patchTurn(msgId, { live: e.toolCallName });
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
                patchTurn(msgId, {
                  harness: { checked: order.length, seconds: (Date.now() - started) / 1000, line: "", steps: steps() },
                });
                break;
              }
              case "CUSTOM": {
                const e = event as CustomEvent;
                if (e.name === "harness") {
                  harness = { ...(e.value as HarnessSummary), steps: steps() };
                  patchTurn(msgId, { harness });
                } else if (e.name === "thinking" && typeof e.value === "string") {
                  thinking += e.value;
                  patchTurn(msgId, { thinking });
                }
                break;
              }
              case "STATE_SNAPSHOT": {
                const snapshot = (event as StateSnapshotEvent).snapshot as { reply?: ReplyCard } | undefined;
                if (snapshot?.reply) {
                  card = snapshot.reply;
                  patchTurn(msgId, { card });
                }
                break;
              }
              case "RUN_ERROR":
                failure = (event as RunErrorEvent).message;
                break;
              default:
                break;
            }
          },
          onRunFailed: ({ error }) => {
            failure = error.message;
          },
        });

        await agent.runAgent({ runId: nextId("run"), tools: [], context: [], forwardedProps: {} });
        finish();
      } catch (error) {
        patchTurn(msgId, { running: false, live: undefined, error: (error as Error).message });
      }
    },
    [patchTurn],
  );

  // ------------------------------------------------------------ a typed message
  /**
   * One chat turn through the agent graph (AG-UI): the front agent reads the message with tools,
   * shows the cards it chooses (declared here as frontend tools), or hands off to the tuner; its
   * answer and the suggested replies arrive as shared state. The conversation is remembered by
   * the server per chat, so only the new message is sent.
   */
  const runChat = useCallback(
    async (words: string, msgId: string) => {
      let failure: string | undefined;
      let answer: api.AskAnswer | null = null;
      let count = 0;
      let thinking = "";
      try {
        const agent = new HttpAgent({
          url: AGENT_URL,
          agentId: "kta-tune-assist",
          threadId: threadId.current,
          description: "KTuner Assistant",
          initialState: { mode: "chat", text: words, thread_id: threadId.current, upload_id: null },
        });
        agent.addMessage({ id: nextId("m"), role: "user", content: words });
        agent.subscribe({
          onEvent({ event }) {
            switch (event.type) {
              case "TOOL_CALL_START": {
                const e = event as ToolCallStartEvent;
                count += 1;
                patch(msgId, { live: e.toolCallName, liveCount: count });
                break;
              }
              case "CUSTOM": {
                const e = event as CustomEvent;
                if (e.name === "thinking" && typeof e.value === "string") thinking += e.value;
                break;
              }
              case "STATE_SNAPSHOT": {
                const snapshot = (event as StateSnapshotEvent).snapshot as { answer?: api.AskAnswer } | undefined;
                if (snapshot?.answer) {
                  answer = snapshot.answer;
                  patch(msgId, { pending: false, live: undefined, answer });
                }
                break;
              }
              case "RUN_ERROR":
                failure = (event as RunErrorEvent).message;
                break;
              default:
                break;
            }
          },
          onRunFailed: ({ error }) => {
            failure = error.message;
          },
        });
        await agent.runAgent({ runId: nextId("run"), tools: UI_TOOLS, context: [], forwardedProps: {} });
      } catch (error) {
        failure = (error as Error).message;
      }
      const got = answer as api.AskAnswer | null;
      if (!got) {
        patch(msgId, { pending: false, live: undefined, error: failure ?? "No answer came back. Send it again." });
        return;
      }
      patch(msgId, { pending: false, live: undefined, answer: thinking && !got.thinking ? { ...got, thinking } : got });
      // The car editor is the one card in the thread: the agent's call fills it, never a second one.
      const editor = got.ui?.find((c) => c.tool === "show_car_editor");
      if (editor && "draft" in editor) openEditor(editor.draft);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patch],
  );

  // ------------------------------------------------------------------ send
  const send = useCallback(
    async (text: string, file?: File | null, tags?: api.LogTags) => {
      const words = text.trim();
      if (!words && !file) return;
      const kind = file ? (/\.csv$/i.test(file.name) || file.type === "text/csv" ? "csv" : "image") : null;
      const thumb = file && kind === "image" ? await thumbOf(file) : undefined;
      const user: UserMsg = {
        id: nextId("u"),
        role: "user",
        text: words,
        file: file && kind ? { name: file.name, kind, size: file.size, thumb, tags: kind === "csv" ? tags : undefined } : undefined,
      };

      await guard(async () => {
        const id = nextId("a");
        if (file && kind === "csv") {
          add(user, { id, role: "assistant", kind: "drive", turn: { id, fileName: file.name, running: true, card: null, harness: null, lines: [] } });
          await runDrive(file, words, id, tags);
          return;
        }
        if (file) {
          add(user, { id, role: "assistant", kind: "ask", pending: true });
          try {
            patch(id, { pending: false, answer: await api.askScreenshot(file, words) });
          } catch (e) {
            patch(id, { pending: false, error: (e as Error).message });
          }
          return;
        }
        add(user, { id, role: "assistant", kind: "ask", pending: true });
        await runChat(words, id);
      });
    },
    [add, guard, patch, runDrive, runChat],
  );

  // ------------------------------------------------------------- Car profile
  const saveCar = useCallback(
    async (msgId: string, fields: CarProfile) => {
      await guard(async () => {
        try {
          const out = await api.saveProfile(fields);
          const fresh = await api.readLoop();
          setLoop(fresh);
          const first = !fresh?.hasDrives;
          patch(msgId, { saved: out.line, draft: { fields: out.profile, filled: {}, missing: [], prefilled: [] } });
          add({
            id: nextId("a"),
            role: "assistant",
            kind: "note",
            text: first
              ? `Saved. Your car starts on Map version 1, ${fresh?.ktunerBasemap ?? "the KTuner basemap"}: that's the map I compare every change against.`
              : out.line,
            detail: first ? "Next, I need one log from your car. Here is the drive that gives me the most to work with." : undefined,
            guide: first,
          });
        } catch (e) {
          patch(msgId, { error: (e as Error).message });
        }
      });
    },
    [add, guard, patch],
  );

  /**
   * The one car editor, in the thread (tuning-shop D24). If an editor is already open in this
   * chat, it takes the new draft and comes into view; only when none is open is one added.
   * Pressing "Edit car" twice never makes two cards.
   */
  const openEditor = useCallback((draft: ProfileDraft) => {
    let target = "";
    setMessages((all) => {
      const open = [...all].reverse().find((m) => m.role === "assistant" && m.kind === "profile" && !m.saved && m.draft);
      if (open) {
        target = open.id;
        return all.map((m) => (m.id === open.id && m.role === "assistant" ? { ...m, draft, rev: (m.rev ?? 1) + 1 } : m));
      }
      target = nextId("a");
      return [...all, { id: target, role: "assistant", kind: "profile", draft, rev: 1 } as AiMsg];
    });
    setTimeout(() => target && setFocus({ id: target, at: Date.now() }), 0);
  }, []);

  const editCar = useCallback(() => {
    if (!loop?.carProfile) return;
    openEditor({ fields: { ...loop.carProfile, parts: [...loop.carProfile.parts] }, filled: {}, missing: [], prefilled: [] });
  }, [loop, openEditor]);

  const showGuide = useCallback(() => {
    add(
      { id: nextId("u"), role: "user", text: "How should I log my drive?" },
      { id: nextId("a"), role: "assistant", kind: "note", text: "Log the drive below with TunerView, then attach the CSV here.", guide: true },
    );
  }, [add]);

  // -------------------------------------------------------- owner questions
  const answer = useCallback(
    async (fromMsg: string, question: OwnerQuestion, choiceId: string) => {
      const label = question.choices.find((c) => c.id === choiceId)?.label ?? choiceId;
      if (!question.askedOn) return;
      const driveId = question.askedOn;
      await guard(async () => {
        const id = nextId("a");
        add({ id: nextId("u"), role: "user", text: label }, { id, role: "assistant", kind: "answer", pending: true, driveId });
        try {
          const result = await api.answerQuestion(question.kind, driveId, choiceId);
          // Every copy of this question in the thread now shows the saved answer.
          const asked = question.id;
          const mark = (qs: OwnerQuestion[] | null | undefined) =>
            qs?.map((q) => (q.id === asked ? { ...q, answer: choiceId } : q)) ?? qs;
          setMessages((all) =>
            all.map((m) => {
              if (m.role !== "assistant") return m;
              if (m.id === id) return { ...m, pending: false, result: { ...result, questions: mark(result.questions) ?? null } };
              if (m.turn?.card?.questions) return { ...m, turn: { ...m.turn, card: { ...m.turn.card, questions: mark(m.turn.card.questions) } } };
              if (m.result?.questions) return { ...m, result: { ...m.result, questions: mark(m.result.questions) ?? null } };
              return m;
            }),
          );
        } catch (e) {
          patch(id, { pending: false, error: (e as Error).message });
        }
      });
    },
    [add, guard, patch],
  );

  // ------------------------------------------------------------------ Flash
  const flash = useCallback(
    async (fromMsg: string, action: "confirm" | "not-now" | "undo" | "revert", ref: { changeId?: string; version?: number }) => {
      const said =
        action === "confirm" ? "I flashed it." : action === "not-now" ? "Not now." : action === "undo" ? "I flashed the earlier map back." : "I flashed the KTuner basemap.";
      await guard(async () => {
        const id = nextId("a");
        add({ id: nextId("u"), role: "user", text: said }, { id, role: "assistant", kind: "flash", pending: true });
        try {
          const outcome =
            action === "confirm"
              ? await api.flashConfirm(ref.changeId ?? "")
              : action === "not-now"
                ? await api.flashNotNow(ref.changeId ?? "")
                : await api.flashRestore(ref.version ?? 1, action);
          patch(id, { pending: false, outcome });
          patch(fromMsg, { acted: said });
        } catch (e) {
          patch(id, { pending: false, error: (e as Error).message });
        }
      });
    },
    [add, guard, patch],
  );

  /** Edit a sent message, as in ChatGPT/Claude: the thread from that message on is replaced by the new turn. */
  const editAndResend = useCallback(
    async (id: string, text: string) => {
      if (running.current) return;
      setMessages((all) => {
        const at = all.findIndex((m) => m.id === id);
        return at < 0 ? all : all.slice(0, at);
      });
      await send(text);
    },
    [send],
  );

  const newChat = useCallback(() => {
    if (running.current) return;
    threadId.current = nextId("thread");
    setChatId(threadId.current);
    setMessages([]);
    void refreshChats();
  }, [refreshChats]);

  const openChat = useCallback(
    async (id: string) => {
      if (running.current || id === threadId.current) return;
      const chat = await api.readChat<Msg>(id);
      if (!chat) return;
      threadId.current = chat.id;
      setChatId(chat.id);
      setMessages(settle(chat.messages));
    },
    [],
  );

  const removeChat = useCallback(
    async (id: string) => {
      if (running.current) return;
      await api.deleteChat(id);
      if (id === threadId.current) {
        threadId.current = nextId("thread");
        setChatId(threadId.current);
        setMessages([]);
      }
      void refreshChats();
    },
    [refreshChats],
  );

  return {
    messages, loop, busy, ready, send, saveCar, editCar, showGuide, answer, flash, newChat, refresh, editAndResend,
    chats, chatId, openChat, removeChat, focus,
  };
}

/** A small preview of an attached picture, kept with the message. */
function thumbOf(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const k = 96 / Math.max(img.width, img.height);
        canvas.width = Math.round(img.width * k);
        canvas.height = Math.round(img.height * k);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(undefined);
      img.src = url;
    } catch {
      resolve(undefined);
    }
  });
}
