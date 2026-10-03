"""Print the owner's nine real Drives as the chat shows them, so the copy can be
read end to end. Not a test:  python3 tests/seam1/replay.py

The table at the end is the loop this ticket is about: Drive → Next step → what
settles it, with the Wasted drives marked.
"""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from conftest import Loop  # noqa: E402


def gauge_rows(table) -> str:
    if not table:
        return "—"
    return "; ".join(f"{row['gauge']}: OK {row['ok']} / if {row['see']} / then {row['then']}" for row in table["rows"])


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        loop = Loop(Path(tmp)).start()
        try:
            rows = []
            for example_id, reply in loop.run(loop.reply_to_all_owner_drives()):
                card = reply.card
                print("=" * 78)
                print(f"{example_id}  ·  {reply.harness_line()}")
                print(card["say"])
                print(card["window"])
                print("  " + "  ".join(f"{t['label']}: {t['value']}{t['unit']}" for t in card["numbers"]))
                mv = card.get("mapVersion")
                print("  " + (mv["line"] if mv else "—"))
                # A Too-short drive gets no Verdict word (CONTEXT.md), so it reads
                # as the one word that explains it rather than a status name.
                print(f"  Verdict: {card['verdict'] or 'no verdict: too short'}")
                for row in card["settled"]:
                    print(f"  Asked last time: {row['word']} — {row['title']}: {row['why']}")
                if card["wasted"]:
                    print(f"  Wasted drive: {card['wasted']}")
                print(f"  Flash plan: {card['flashPlan']['headline'] if card['flashPlan'] else '—'}")
                step = card["nextStep"]
                print(f"  Next step [{step['kind']}{', same step' if step['same'] else ''}]: {step['title']}")
                if step["body"]:
                    print(f"    {step['body']}")
                for line in (step["recipe"] or {}).get("steps", []):
                    print(f"      - {line}")
                if step["gauges"]:
                    print("    Gauges:")
                    for row in step["gauges"]["rows"]:
                        print(f"      - {row['gauge']}: OK {row['ok']} / if you see {row['see']} / then {row['then']}")
                if step["also"]:
                    print(f"    Also seen today: {step['also']['why']}")
                print(f"    The next upload proves: {step['proves'] or '—'}")
                print(f"    {step['uploadWhen']}")
                print("  steps: " + " · ".join(s["name"] for s in card["harness"]["steps"]))
                rows.append(
                    {
                        "drive": example_id,
                        "next_step": step["title"],
                        "kind": step["kind"] + (" (same)" if step["same"] else ""),
                        "settles_on": step["uploadWhen"].replace("Upload when: ", ""),
                        "settled_here": ", ".join(f"{r['word']} {r['title'].split(':')[0]}" for r in card["settled"]) or "—",
                        "wasted": "yes" if card["wasted"] else "",
                    }
                )

            print("=" * 78)
            print(f"{'Drive':<12} {'Next step':<44} {'Upload when':<40} {'Settled here'}")
            print("-" * 140)
            for row in rows:
                print(
                    f"{row['drive']:<12} {row['next_step'][:43]:<44} {row['settles_on'][:39]:<40} "
                    f"{row['settled_here']}{' · WASTED' if row['wasted'] else ''}"
                )
            print("=" * 78)
            print("Open steps after the nine Drives:")
            for step in loop.store.list_open_steps(only_open=True):
                print(f"  {step['status']:<5} {step['title']}: {step['why']}")
            print(json.dumps([{k: s[k] for k in ("key", "status")} for s in loop.store.list_open_steps()]))
        finally:
            loop.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
