/** One stroke icon set (Lucide geometry, 24-unit grid), drawn inline so nothing loads. */
const PATHS: Record<string, string> = {
  plus: "M12 5v14M5 12h14",
  send: "M12 19V5M5 12l7-7 7 7",
  menu: "M4 6h16M4 12h16M4 18h16",
  panel: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 3v18",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  newchat: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  x: "M18 6 6 18M6 6l12 12",
  file: "M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM9 13h6M9 17h6",
  image: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM21 15l-5-5L5 21M9 9.5a1.5 1.5 0 1 0 0-.01",
  chev: "M9 6l6 6-6 6",
  check: "M5 12l5 5 9-11",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  sun: "M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  gauge: "M12 14l4-4M3.3 19a10 10 0 1 1 17.4 0",
  car: "M5 17h14M5 17a2 2 0 1 1-4 0v-5l2.5-5.5A2 2 0 0 1 5.3 5h13.4a2 2 0 0 1 1.8 1.5L23 12v5a2 2 0 1 1-4 0M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M1 12h22",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  unlock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  upload: "M12 21V9M7 14l5-5 5 5M5 3h14",
  undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  spark: "M12 3l1.9 5.8L20 10.7l-5 3.6 1.9 5.9L12 16.6l-4.9 3.6L9 14.3l-5-3.6 6.1-1.9z",
  route: "M6 19a3 3 0 1 0 0-.01M18 5a3 3 0 1 0 0-.01M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",
};

export function Icon({ name, className = "icon", label }: { name: keyof typeof PATHS | string; className?: string; label?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}

/** The app's mark: a gauge needle, drawn once. */
export function Mark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" }}>
      <path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" />
      <path d="M12 13.5l4.5-4.5" />
    </svg>
  );
}
