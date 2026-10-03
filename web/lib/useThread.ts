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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AGENT_URL,
  SERVER_URL,
  type CarProfile,
  type DriveWindow,
  type HarnessSummary,
  type HarnessStep,
  type InstallRow,
  type LoopState,
  type OpenStep,
  type ProfileDraft,
  type ProfileSpec,
  type ReplyCard,
  type Turn,
} from "./types";

import type { PendingQuestion } from "../components/OpenStepsPanel";

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

/**
 * The Open steps and the questions waiting for the owner, as the panel reads them.
 * The loop's own state, from the server — never guessed in the browser. The Car
 * profile, its form spec and the drive window ride the same read.
 */
async function readLoop(): Promise<{
  openSteps: OpenStep[];
  questions: PendingQuestion[];
  carProfile: CarProfile | null;
  profileSpec: ProfileSpec | null;
  hasLlm: boolean;
  hasDrives: boolean;
  driveWindow: DriveWindow | null;
  installs: InstallRow[];
}> {
  const empty = {
    openSteps: [],
    questions: [],
    carProfile: null,
    profileSpec: null,
    hasLlm: false,
    hasDrives: false,
    driveWindow: null,
    installs: [],
  };
  try {
    const response = await fetch(`${SERVER_URL}/api/state`, { cache: "no-store" });
    if (!response.ok) return empty;
    const body = (await response.json()) as {
      openSteps?: OpenStep[];
      unansweredQuestions?: { id: string; title: string; askedOn?: string | null }[];
      carProfile?: CarProfile | null;
      profileSpec?: ProfileSpec | null;
      hasLlm?: boolean;
      hasDrives?: boolean;
      driveWindow?: DriveWindow | null;
      installs?: InstallRow[];
    };
    return {
      openSteps: body.openSteps ?? [],
      questions: body.unansweredQuestions ?? [],
      carProfile: body.carProfile ?? null,
      profileSpec: body.profileSpec ?? null,
      hasLlm: body.hasLlm ?? false,
      hasDrives: body.hasDrives ?? false,
      driveWindow: body.driveWindow ?? null,
      installs: body.installs ?? [],
    };
  } catch {
    return empty;
  }
}

export function useThread() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [openSteps, setOpenSteps] = useState<OpenStep[]>([]);
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [carProfile, setCarProfile] = useState<CarProfile | null>(null);
  const [profileSpec, setProfileSpec] = useState<ProfileSpec | null>(null);
  const [hasLlm, setHasLlm] = useState(false);
  const [hasDrives, setHasDrives] = useState(false);
  const threadId = useMemo(() => nextId("thread"), []);
  const running = useRef(false);

  const refreshLoop = useCallback(async () => {
    const loop = await readLoop();
    setOpenSteps(loop.openSteps);
    setQuestions(loop.questions);
    setCarProfile(loop.carProfile);
    setProfileSpec(loop.profileSpec);
    setHasLlm(loop.hasLlm);
    setHasDrives(loop.hasDrives);
  }, []);

  // The panel shows the loop from the first paint, so an owner who reloads the
  // chat still sees the steps they are holding.
  useEffect(() => {
    void refreshLoop();
  }, [refreshLoop]);

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

  // An owner answer pauses and resumes the reply with the answer applied:
  // the answered Turn's card gets the new questions, Next step and housing,
  // and the panel beside the thread follows the loop.
  const answered = useCallback(
    (
      turnId: string,
      updated: {
        questions: ReplyCard["questions"];
        nextStep: ReplyCard["nextStep"];
        housing: ReplyCard["housing"];
        unansweredQuestions: PendingQuestion[];
      },
    ) => {
      patch(turnId, (prev) => ({
        card: prev.card
          ? { ...prev.card, questions: updated.questions, nextStep: updated.nextStep, housing: updated.housing }
          : prev.card,
      }));
      setQuestions(updated.unansweredQuestions);
      void refreshLoop();
    },
    [patch, refreshLoop],
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
        // The Open steps moved: the panel beside the thread follows the loop.
        void refreshLoop();
      }
    },
    [patch, threadId, refreshLoop],
  );

  return { turns, busy, threadId, send, openSteps, questions, answered, carProfile, profileSpec, hasLlm, hasDrives, refreshLoop };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return { text };
  }
}

/** Fill the typed Car profile card from the owner's own words. Saves nothing. */
export async function draftProfile(text: string): Promise<ProfileDraft> {
  const response = await fetch(`${SERVER_URL}/api/profile/draft`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? "The card did not fill.");
  return ((await response.json()) as { draft: ProfileDraft }).draft;
}

/** Confirm the Car profile card. Nothing is saved before this call. */
export async function saveProfile(fields: CarProfile): Promise<{ profile: CarProfile; installs: InstallRow[]; line: string }> {
  const response = await fetch(`${SERVER_URL}/api/profile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? "The profile did not save.");
  return (await response.json()) as { profile: CarProfile; installs: InstallRow[]; line: string };
}

/** Record an Install: a part fitted or removed, with its date. */
export async function recordInstall(part: string, action: string, installedAt: number): Promise<{ install: InstallRow; line: string }> {
  const response = await fetch(`${SERVER_URL}/api/installs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ part, action, installed_at: installedAt }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? "The Install did not record.");
  return (await response.json()) as { install: InstallRow; line: string };
}

/** A typed question with no Drive uploaded: setup fills, tuning waits. */
export async function askWithoutDrive(text: string, flow?: string): Promise<{ kind: string; answer?: string; draft?: ProfileDraft; window?: string }> {
  const response = await fetch(`${SERVER_URL}/api/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(flow ? { text, flow } : { text }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? "The question did not go through.");
  return (await response.json()) as { kind: string; answer?: string; draft?: ProfileDraft; window?: string };
}