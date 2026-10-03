"use client";

/**
 * Ask without uploading: one line, one answer. The answer comes first in plain
 * words with the owner's own numbers, then the window it read, then the cards
 * it cites (quiet footnotes). The server answers; nothing here decides.
 */
import { useState } from "react";

import { askWithoutDrive, type AskAnswer } from "../lib/useThread";
import { CitedSay } from "./Citations";

export function AskBox() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      setAnswer(await askWithoutDrive(text.trim()));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "The question did not go through.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ask" data-testid="ask">
      <form onSubmit={submit}>
        <input
          type="text"
          value={text}
          data-testid="ask-input"
          placeholder="Ask about your car, for example: why is it slower in the heat?"
          aria-label="Ask about your car"
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" disabled={busy || !text.trim()} data-testid="ask-send">
          {busy ? "Reading…" : "Ask"}
        </button>
      </form>
      {error ? <p className="muted">{error}</p> : null}
      {answer?.answer ? (
        <div className="ask-answer" data-testid="ask-answer">
          <p>
            <CitedSay say={answer.answer} citations={answer.citations} />
          </p>
          {answer.window ? <p className="muted" data-testid="ask-window">{answer.window}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
