"use client";

/**
 * KTuner Assistant: a chat, laid out like Claude and ChatGPT. Sidebar with the
 * car and the tuning journey; one thread; one composer that takes words, a
 * TunerView CSV or a screenshot.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { Composer, refuse } from "../components/Composer";
import { Icon } from "../components/Icons";
import { Message, type Actions } from "../components/Messages";
import { phaseOf, Sidebar } from "../components/Sidebar";
import { TableViewer } from "../components/TableViewer";
import { FUELS, type LogTags } from "../lib/api";
import { useChat } from "../lib/useChat";

const EXAMPLE =
  "Civic FE 1.5T CVT on E10 RON95, hot city traffic. Intake, downpipe, front pipe, catback, big intercooler and a CVT cooler. I flashed KTuner Starter 21 Dual Tune 2.";

function useTheme(): [string | null, () => void] {
  // The theme in force: the saved choice, else the system's.
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("kta-theme");
    } catch {
      /* system theme it is */
    }
    if (saved) document.documentElement.dataset.theme = saved;
    setTheme(saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("kta-theme", next);
    } catch {
      /* fine */
    }
  };
  return [theme, toggle];
}

export default function Page() {
  const chat = useChat();
  const { messages, loop, busy } = chat;
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Closed on first paint: a phone never sees the drawer slide away; a desktop opens it at once.
  const [side, setSide] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const [viewing, setViewing] = useState<string | null>(null);
  // The fuel and map slot the next log is tagged with: the last ones used (a per-viewer convenience).
  const [tags, setTags] = useState<LogTags>({ fuel: FUELS[0], slot: 1 });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kta-tags") ?? "null") as LogTags | null;
      if (saved?.fuel) setTags(saved);
    } catch {
      /* defaults */
    }
  }, []);
  const changeTags = (next: LogTags) => {
    setTags(next);
    try {
      localStorage.setItem("kta-tags", JSON.stringify(next));
    } catch {
      /* fine */
    }
  };
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // The sidebar follows the breakpoint: open beside the chat on a desktop, a closed drawer on a phone.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    setSide(wide.matches);
    const follow = (event: MediaQueryListEvent) => setSide(event.matches);
    wide.addEventListener("change", follow);
    return () => wide.removeEventListener("change", follow);
  }, []);
  const closeOnPhone = useCallback(() => {
    if (window.innerWidth < 1024) setSide(false);
  }, []);

  // Follow the reply as it streams, unless the owner scrolled up to read.
  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  const submit = useCallback(
    (words = text, attached = file) => {
      if (busy) return;
      pinned.current = true;
      void chat.send(words, attached, tags);
      setText("");
      setFile(null);
      setError(null);
    },
    [busy, chat, file, text, tags],
  );

  const actions: Actions = {
    busy,
    loop,
    onAnswer: (id, q, choice) => {
      pinned.current = true;
      void chat.answer(id, q, choice);
    },
    onFlash: (id, action, ref) => {
      pinned.current = true;
      void chat.flash(id, action, ref);
    },
    onSaveCar: (id, fields) => {
      pinned.current = true;
      void chat.saveCar(id, fields);
    },
    onSuggest: (words) => submit(words, null),
    onGuide: () => {
      pinned.current = true;
      chat.showGuide();
    },
    onViewTable: (table) => setViewing(table),
    onEdit: (id, words) => {
      pinned.current = true;
      void chat.editAndResend(id, words);
    },
  };

  const phase = phaseOf(loop);
  const empty = chat.ready && messages.length === 0;
  const car = loop?.carProfile;
  const placeholder = "Message KTuner Assistant…";

  const composer = (
    <div className="composer-wrap">
      <Composer
        text={text}
        setText={setText}
        file={file}
        setFile={setFile}
        error={error}
        setError={setError}
        onSend={() => submit()}
        tags={tags}
        setTags={changeTags}
        busy={busy}
        placeholder={placeholder}
        autoFocus
      />
      {!empty ? <p className="disclaimer">Every number comes from your own logs and is checked before you see it. Nothing changes your map until you flash it.</p> : null}
    </div>
  );

  return (
    <div className={`app ${side ? "side-open" : "side-closed"}`}>
      <Sidebar
        loop={loop}
        busy={busy}
        onNewChat={chat.newChat}
        onEditCar={chat.editCar}
        onClose={closeOnPhone}
        onToggle={() => setSide(false)}
        onFlashBasemap={() => void chat.flash("", "revert", { version: 1 })}
        onGuide={() => chat.showGuide()}
      />
      <div className="scrim" onClick={() => setSide(false)} aria-hidden="true" />

      <main
        className="main"
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (!dropped) return;
          const why = refuse(dropped);
          setError(why);
          if (!why) setFile(dropped);
        }}
      >
        <header className="topbar">
          {!side ? (
            <button type="button" className="icon-btn" aria-label="Open sidebar" data-testid="open-sidebar" onClick={() => setSide(true)}>
              <Icon name="menu" />
            </button>
          ) : null}
          <div className="topbar-title">
            {car ? car.model || "Your car" : "KTuner Assistant"}
            {loop?.activeMapVersion ? <span className="muted">· {loop.activeMapVersion.label}</span> : null}
          </div>
          <span className="spacer" />
          <button type="button" className="icon-btn" aria-label="Switch light or dark" title="Switch light or dark" onClick={toggleTheme}>
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
        </header>

        {!chat.ready ? (
          <div className="scroll" aria-busy="true" />
        ) : empty ? (
          <div className="welcome" data-testid="empty">
            {phase === "car" ? (
              <>
                <h1>Let&apos;s tune your car.</h1>
                <p>
                  Tell me about it in your own words: model, gearbox, fuel, where you drive, the parts you fitted and which KTuner map you
                  flashed. I&apos;ll fill your car profile and keep it.
                </p>
              </>
            ) : phase === "baseline" ? (
              <>
                <h1>Ready for your first log.</h1>
                <p>Attach a TunerView CSV, or drop it anywhere here. I&apos;ll tell you if the engine is OK and what to do next.</p>
              </>
            ) : (
              <>
                <h1>What are we tuning today?</h1>
                <p>Attach your latest TunerView log, or ask about your car.</p>
              </>
            )}
            {composer}
            <div className="chips">
              {phase === "car" ? (
                <button type="button" className="chip" data-testid="use-example" onClick={() => {
                    setText(EXAMPLE);
                    document.getElementById("composer-text")?.focus();
                  }}>
                  <Icon name="car" />
                  Use an example description
                </button>
              ) : null}
              <button type="button" className="chip" onClick={actions.onGuide}>
                <Icon name="route" />
                How should I log a drive?
              </button>
              {car && loop?.hasDrives ? (
                <>
                  <button type="button" className="chip" onClick={() => submit("Why is my car slower in the heat?", null)}>
                    <Icon name="help" />
                    Why is it slower in the heat?
                  </button>
                  <button type="button" className="chip" onClick={() => submit("Is my knock control OK?", null)}>
                    <Icon name="gauge" />
                    Is my knock control OK?
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div
              className="scroll"
              ref={scroller}
              onScroll={(event) => {
                const el = event.currentTarget;
                pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
              }}
            >
              <div className="thread" data-testid="thread" role="log" aria-live="polite">
                {messages.map((m, i) => (
                  <Message key={m.id} msg={m} latest={i === messages.length - 1} a={actions} />
                ))}
              </div>
            </div>
            {composer}
          </>
        )}

        <TableViewer table={viewing} onClose={() => setViewing(null)} />
        {dragging ? (
          <div className="drop" aria-hidden="true">
            <div>
              Drop to attach
              <span className="muted">A TunerView CSV, or a screenshot</span>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
