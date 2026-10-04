"""Tuning shop: is premium fuel (E10 RON97 III) worth it? Drives tagged with their fuel at upload."""

from __future__ import annotations

from conftest import OWNER_FILE_NAMES, Loop, owner_csv


def tagged(loop: Loop, example_id: str, fuel: str, slot: int = 1):
    upload = loop.run(
        loop._client.post(
            "/upload",
            files={"file": (OWNER_FILE_NAMES[example_id], owner_csv(example_id).encode(), "text/csv")},
            data={"threadId": loop.thread_id, "fuel": fuel, "slot": str(slot)},
        )
    ).json()["uploadId"]
    return loop.send(upload)


def test_no_tags_means_the_fuel_test_says_why_it_cannot_tell(loop: Loop):
    loop.upload_and_reply("sep01-0813")
    body = loop.get("/api/fuel-test").json()
    assert body["status"] == "cant-tell"
    assert body["line"].startswith("Can't tell yet: No Drive is tagged")


def test_matched_drives_on_two_fuels_are_compared_by_knock_control(loop: Loop):
    tagged(loop, "aug30-1529", "E10 RON95 III")
    reply = tagged(loop, "sep01-0813", "E10 RON97 III")
    body = loop.get("/api/fuel-test").json()
    assert [g["fuel"] for g in body["grades"]] == ["E10 RON95 III", "E10 RON97 III"]
    # The reply of the second fuel's Drive carries the test and its tags.
    assert reply.card["tags"] == {"fuel": "E10 RON97 III", "slot": 1}
    assert reply.card["fuelTest"]["line"] == body["line"]
    if body["status"] == "measured":
        pair = body["pairs"][0]
        assert pair["iatGap"] <= body["iatMatch"]
        assert "Knock Control peak" in body["line"]
    else:
        assert "matched pair" in body["line"]


def test_a_different_map_slot_is_never_compared(loop: Loop):
    tagged(loop, "aug30-1529", "E10 RON95 III", slot=1)
    tagged(loop, "sep01-0813", "E10 RON97 III", slot=2)
    assert "same map slot" in loop.get("/api/fuel-test").json()["line"]
