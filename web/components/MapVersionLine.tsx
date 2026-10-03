"use client";

/**
 * Which Map version this Drive ran on: one quiet line under the four numbers,
 * because the owner must never wonder which map the car is on (CONTEXT.md:
 * Map version). `on Map version 1 · Starter 21 Dual Tune 2`.
 *
 * The first time the owner sees it, the server sends a one-line footnote saying
 * what a Map version is. After that the line stands alone — a tooltip nobody can
 * find is not an explanation.
 */
import type { MapVersionCard } from "../lib/types";

export function MapVersionLine({ card }: { card: MapVersionCard }) {
  return (
    <div className="mapver" data-testid="map-version" data-version={card.version}>
      <span className="mapver-line">{card.line}</span>
      {card.note ? <span className="mapver-note">{card.note}</span> : null}
    </div>
  );
}