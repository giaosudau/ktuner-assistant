"use client";

/** The four numbers: intake air, Knock Control start → peak, worst trims, pulls. */
import type { NumberTile } from "../lib/types";

export function NumberRow({ tiles }: { tiles: NumberTile[] }) {
  if (!tiles.length) return null;
  return (
    <div className="tiles" data-testid="numbers">
      {tiles.map((tile) => (
        <div className="tile" key={tile.label}>
          <b>
            {tile.value}
            {tile.unit ? <span style={{ fontSize: 12 }}>{tile.unit}</span> : null}
          </b>
          <span>{tile.label}</span>
        </div>
      ))}
    </div>
  );
}