/**
 * Reading the typed answer out of AG-UI shared-state events (tuning-shop D19–D25).
 *
 * The graph leaves its answer in state, so it reaches the chat as an AG-UI
 * STATE_SNAPSHOT carrying the whole state; a STATE_DELTA carries JSON patches
 * against it instead. Both shapes are read the same way: a value that looks
 * like an answer (prose, a kind, or cards the agent chose) is one.
 */
import type { AskAnswer } from "./api";

/** A value that reads as a typed answer: prose, a decided kind, or cards shown. */
export function takeAnswer(value: unknown): AskAnswer | null {
  if (!value || typeof value !== "object") return null;
  if (!("answer" in value || "kind" in value || "ui" in value)) return null;
  return value as AskAnswer;
}

/**
 * The answer out of a STATE_DELTA's JSON patches, or null when no patch writes
 * the whole answer. Partial paths (one suggestion, one card) are left for the
 * snapshot: the run always ends with one.
 */
export function answerFromDelta(delta: unknown): AskAnswer | null {
  if (!Array.isArray(delta)) return null;
  for (const op of delta) {
    if (!op || typeof op !== "object") continue;
    const path = (op as { path?: unknown }).path;
    if (Array.isArray(path) && path.length === 1 && path[0] === "answer") {
      const got = takeAnswer((op as { value?: unknown }).value);
      if (got) return got;
    }
  }
  return null;
}
