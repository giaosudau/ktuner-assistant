"""Print the owner's nine real Drives as the chat shows them, so the copy can be
read end to end. Not a test:  python3 tests/seam1/replay.py
"""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from conftest import Loop  # noqa: E402


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        loop = Loop(Path(tmp)).start()
        try:
            for example_id, reply in loop.run(loop.reply_to_all_owner_drives()):
                card = reply.card
                print("=" * 78)
                print(f"{example_id}  ·  {reply.harness_line()}")
                print(card["say"])
                print(card["window"])
                print("  " + "  ".join(f"{t['label']}: {t['value']}{t['unit']}" for t in card["numbers"]))
                # A Too-short drive gets no Verdict word (CONTEXT.md), so it reads
                # as the one word that explains it rather than a status name.
                print(f"  Verdict: {card['verdict'] or 'no verdict: too short'}")
                print(f"  Flash plan: {card['flashPlan']['headline'] if card['flashPlan'] else '—'}")
                step = card["nextStep"]
                print(f"  Next step [{step['kind']}]: {step['title']}")
                print(f"    {step['body']}")
                print(f"    Upload: {step['upload']}")
                print("  steps: " + " · ".join(s["name"] for s in card["harness"]["steps"]))
            print("=" * 78)
            print(json.dumps(loop.store.list_open_steps(), indent=2)[:600])
        finally:
            loop.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())