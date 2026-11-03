"use client";

/**
 * One composer, as in every chat app: type, attach with +, send with Enter.
 * A TunerView CSV or a screenshot rides as a chip above the text; Shift+Enter
 * is a new line.
 */
import { useEffect, useRef } from "react";

import { FUELS, type LogTags } from "../lib/api";
import { secondsWords, sizeOf, useElapsed } from "../lib/useChat";
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
  tags,
  setTags,
  briefSlot,
  busySince,
}: {
  text: string;
  setText: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  error: string | null;
  setError: (e: string | null) => void;
  /** Sends the words as they stand in the box (an Enter can land before React re-renders the text). */
  onSend: (words: string) => void;
  busy: boolean;
  placeholder: string;
  autoFocus?: boolean;
  tags: LogTags;
  setTags: (t: LogTags) => void;
  /** The KTuner map slot the open drive brief asks for, when it names one. */
  briefSlot?: number | null;
  /** When the reply being worked on was sent, for the live seconds in the hint. */
  busySince?: number;
}) {
  const waited = useElapsed(busySince, busy);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const canSend = !busy && (text.trim().length > 0 || file !== null);
  const sendNow = (words: string) => {
    if (!busy && (words.trim().length > 0 || file !== null)) onSend(words);
  };

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
        sendNow(area.current?.value ?? text);
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
          {isCsv ? (
            <div className="log-tags" data-testid="log-tags">
              <label>
                Fuel in the tank
                <select value={tags.fuel} onChange={(e) => setTags({ ...tags, fuel: e.target.value })} data-testid="tag-fuel">
                  {FUELS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label title="KTuner can switch between maps on the fly: which one was this drive on?">
                KTuner map slot
                <select value={tags.slot} onChange={(e) => setTags({ ...tags, slot: Number(e.target.value) })} data-testid="tag-slot">
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {isCsv ? (
            <div className="slot-guard" role="status">
              {typeof briefSlot === "number" && tags.slot !== briefSlot ? (
                <div className="slot-warn" data-testid="slot-warn">
                  <Icon name="alert" />
                  <span>
                    Your drive brief asks for slot {briefSlot} (Tune {briefSlot}). Change it only if you drove on another slot.
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
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
            sendNow(event.currentTarget.value);
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
        <span className="composer-hint">{busy ? (waited !== null ? `Working · ${secondsWords(waited)}` : "Working…") : file ? "" : "Attach a TunerView CSV"}</span>
        <span className="spacer" />
        <button type="submit" className="send-btn" aria-label="Send" data-testid="send" disabled={!canSend}>
          {busy ? <span className="spinner" style={{ borderTopColor: "currentColor" }} /> : <Icon name="send" />}
        </button>
      </div>
    </form>
  );
}
