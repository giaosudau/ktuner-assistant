"use client";

/**
 * One composer, as in every chat app: type, attach with +, send with Enter.
 * A TunerView CSV or a screenshot rides as a chip above the text; Shift+Enter
 * is a new line.
 */
import { useEffect, useRef } from "react";

import { sizeOf } from "../lib/useChat";
import { Icon } from "./Icons";

const IMAGES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE = 6e6;

/** Why a picked file can't be sent, or null when it can. */
export function refuse(file: File): string | null {
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") return file.size ? null : "That CSV is empty.";
  if (IMAGES.includes(file.type)) return file.size > MAX_IMAGE ? "Pictures must be under 6 MB." : null;
  return "Attach a TunerView CSV, or a PNG, JPEG or WebP screenshot.";
}

export function Composer({
  text,
  setText,
  file,
  setFile,
  error,
  setError,
  onSend,
  busy,
  placeholder,
  autoFocus,
}: {
  text: string;
  setText: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  error: string | null;
  setError: (e: string | null) => void;
  onSend: () => void;
  busy: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const canSend = !busy && (text.trim().length > 0 || file !== null);

  // Grow with the text, up to the CSS max-height, like ChatGPT.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(min-width: 1024px)").matches) area.current?.focus();
  }, [autoFocus]);

  const isCsv = file ? /\.csv$/i.test(file.name) || file.type === "text/csv" : false;

  return (
    <form
      className="composer"
      data-testid="composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
    >
      {file ? (
        <div className="attach">
          <div className="file-chip" data-testid="attachment">
            <span className={`ficon${isCsv ? "" : " img"}`}>
              <Icon name={isCsv ? "file" : "image"} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="fname">{file.name}</span>
              <span className="fmeta">{isCsv ? "TunerView log" : "Screenshot"} · {sizeOf(file.size)}</span>
            </span>
            <button type="button" className="icon-btn" aria-label="Remove attachment" onClick={() => setFile(null)}>
              <Icon name="x" />
            </button>
          </div>
        </div>
      ) : null}
      <label className="sr-only" htmlFor="composer-text">
        Message
      </label>
      <textarea
        id="composer-text"
        ref={area}
        rows={1}
        value={text}
        placeholder={placeholder}
        data-testid="composer-text"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData.files?.[0];
          if (pasted) {
            event.preventDefault();
            const why = refuse(pasted);
            setError(why);
            if (!why) setFile(pasted);
          }
        }}
      />
      {error ? (
        <div className="composer-error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="composer-row">
        <input
          ref={picker}
          type="file"
          hidden
          accept=".csv,text/csv,image/png,image/jpeg,image/webp"
          data-testid="file-input"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            event.target.value = "";
            if (!picked) return;
            const why = refuse(picked);
            setError(why);
            if (!why) setFile(picked);
          }}
        />
        <button
          type="button"
          className="round-btn"
          aria-label="Attach a TunerView log or a screenshot"
          title="Attach a TunerView log or a screenshot"
          data-testid="attach"
          onClick={() => picker.current?.click()}
        >
          <Icon name="plus" />
        </button>
        <span className="composer-hint">{busy ? "Working…" : file ? "" : "Attach a TunerView CSV"}</span>
        <span className="spacer" />
        <button type="submit" className="send-btn" aria-label="Send" data-testid="send" disabled={!canSend}>
          {busy ? <span className="spinner" style={{ borderTopColor: "currentColor" }} /> : <Icon name="send" />}
        </button>
      </div>
    </form>
  );
}
