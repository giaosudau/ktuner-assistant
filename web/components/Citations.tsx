"use client";

/**
 * Citations as quiet footnote-style refs, not prose clutter.
 *
 * The sentence keeps its bracketed card ids (`…heat soak. [kc-heat-soak]`),
 * drawn small and superscript; the card titles list once underneath, in the
 * owner's words. With no citations the sentence renders exactly as given, so
 * built-in replies read byte-identical to before.
 */
import type { Citation } from "../lib/types";

const MARKER = /\[([a-z0-9]+(?:-[a-z0-9]+)+)\]/g;

export function splitCited(say: string): { text: string; ids: string[] } {
  const ids: string[] = [];
  const text = say.replace(MARKER, (_match, id: string) => {
    ids.push(id);
    return `⟦${ids.length - 1}⟧`;
  });
  return { text, ids };
}

export function CitedSay({ say, citations }: { say: string; citations?: Citation[] | null }) {
  const { text, ids } = splitCited(say);
  if (ids.length === 0) return <>{say}</>;
  const byId = new Map((citations ?? []).map((c) => [c.id, c.title]));
  const parts = text.split(/⟦(\d+)⟧/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <sup key={i} className="cite-ref" data-testid="cite-ref">
            [{Number(part) + 1}]
          </sup>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
      <div className="cites" data-testid="cites">
        {ids.map((id, n) => (
          <div key={`${id}-${n}`} className="cite">
            [{n + 1}] {byId.get(id) ?? id}
          </div>
        ))}
      </div>
    </>
  );
}
