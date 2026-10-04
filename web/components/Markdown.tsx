"use client";

/**
 * The tuner's answers in the markdown the model writes: headings, paragraphs, bullet and
 * numbered lists, **bold**, *italic* and `code`, with knowledge-card refs ([kc-…]) drawn as
 * quiet superscripts and listed once underneath. React elements only — never innerHTML —
 * so nothing the model writes can run as markup.
 */
import type { ReactNode } from "react";

import type { Citation } from "../lib/types";

function inline(text: string, refs: string[], key: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Card refs first, then **bold**, *italic*, `code`.
  const parts = text.split(/(\[k[cp]-[a-z0-9-]+\]|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g);
  parts.forEach((part, i) => {
    if (!part) return;
    const k = `${key}-${i}`;
    const ref = /^\[(k[cp]-[a-z0-9-]+)\]$/.exec(part);
    if (ref) {
      let n = refs.indexOf(ref[1]);
      if (n < 0) n = refs.push(ref[1]) - 1;
      out.push(
        <sup key={k} className="cite-ref" data-testid="cite-ref">
          [{n + 1}]
        </sup>,
      );
    } else if (part.startsWith("**")) out.push(<strong key={k}>{part.slice(2, -2)}</strong>);
    else if (part.startsWith("`")) out.push(<code key={k}>{part.slice(1, -1)}</code>);
    else if (part.startsWith("*") && part.length > 2) out.push(<em key={k}>{part.slice(1, -1)}</em>);
    else out.push(part);
  });
  return out;
}

export function Markdown({ text, citations }: { text: string; citations?: Citation[] | null }) {
  const refs: string[] = [];
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <h4 key={i} className="md-h">
          {inline(heading[2], refs, `h${i}`)}
        </h4>,
      );
      i += 1;
      continue;
    }
    if (/^\s*([-*•])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: ReactNode[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/ : /^\s*([-*•])\s+/).test(lines[i])) {
        const body = lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*([-*•])\s+/, "");
        items.push(<li key={i}>{inline(body, refs, `l${i}`)}</li>);
        i += 1;
      }
      blocks.push(ordered ? <ol key={`o${i}`}>{items}</ol> : <ul key={`u${i}`}>{items}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s+/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push(<p key={`p${i}`}>{inline(para.join(" "), refs, `p${i}`)}</p>);
  }
  const titles = new Map((citations ?? []).map((c) => [c.id, c.title]));
  return (
    <div className="prose md">
      {blocks}
      {refs.length ? (
        <div className="cites" data-testid="cites">
          {refs.map((id, n) => (
            <div key={id} className="cite">
              [{n + 1}] {titles.get(id) ?? id}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
