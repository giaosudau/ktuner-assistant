"""Seam 1: Car profile, Install and the drive window (ticket 10).

Setup takes about a minute: the chat asks the owner to describe the car in
their own words, the card fills from it, the owner corrects any field and
confirms — nothing is saved before confirm. With no key the same fields show
as a plain form. An Install records a fitted or removed part with its date,
appears in the Car history, and starts the drive window like a Flash. Every
reply states its window, and Drives outside it never decide the Next step.
"""

from __future__ import annotations

from conftest import Loop

from test_reply_words import BANNED

from kta_server import copy as C
from kta_server import window as W

#: The owner's car in their own words, the way the first-open chat asks for it.
DESCRIPTION = (
    "Civic FE 1.5T CVT on E10 RON95 in hot traffic. "
    "Intake, downpipe, front pipe, catback, big intercooler and CVT cooler fitted."
)

DAY_MS = 86_400_000


def post(loop: Loop, path: str, body: dict):
    response = loop.run(loop._client.post(path, json=body))
    return response


def draft(loop: Loop, text: str = DESCRIPTION) -> dict:
    response = post(loop, "/api/profile/draft", {"text": text})
    assert response.status_code == 200, response.text
    return response.json()["draft"]


def confirm(loop: Loop, fields: dict) -> dict:
    response = post(loop, "/api/profile", {"fields": fields})
    assert response.status_code == 200, response.text
    return response.json()


def install(loop: Loop, part: str, installed_at: int, action: str = "fitted") -> dict:
    response = post(loop, "/api/installs", {"part": part, "installed_at": installed_at, "action": action})
    assert response.status_code == 200, response.text
    return response.json()


def drive_start(loop: Loop, drive_id: str) -> int:
    return loop.store.car_state(None)["drives"][drive_id]["start"]


# -- the card fills from the owner's words, and saves nothing before confirm
def test_describing_the_car_fills_the_card_and_saves_nothing(loop: Loop):
    card = draft(loop)

    assert card["fields"] == {
        "model": "Civic FE 1.5T",
        "engine": "1.5T",
        "transmission": "CVT",
        "fuel": "E10 RON95",
        "climate": "Hot traffic",
        "basemap": "Starter 21 Dual Tune 2",
        "parts": ["intake", "downpipe", "front-pipe", "catback", "intercooler", "cvt-cooler"],
    }
    assert card["filled"] == {
        "model": True, "engine": True, "transmission": True, "fuel": True,
        "climate": True, "basemap": False, "parts": True,
    }
    # The basemap is prefilled from the map the app holds, never typed.
    assert card["prefilled"] == ["basemap"]
    assert card["missing"] == []

    # Drafting saves nothing: the Car profile is still empty.
    assert loop.get("/api/state").json()["carProfile"] is None


def test_a_corrected_field_is_saved_as_corrected(loop: Loop):
    card = draft(loop)
    confirm(loop, card["fields"])

    corrected = dict(card["fields"])
    corrected["climate"] = "Hot traffic, 35 °C afternoons"
    corrected["parts"] = ["intake", "downpipe", "front-pipe", "intercooler", "cvt-cooler"]

    out = confirm(loop, corrected)
    assert out["line"] == "Car profile saved."
    assert out["profile"] == corrected
    assert loop.get("/api/state").json()["carProfile"] == corrected

    # Taking the catback off records an Install with its date, like a Flash.
    assert [(r["part"], r["action"]) for r in out["installs"]] == [("catback", "removed")]
    assert loop.get("/api/state").json()["installs"][0]["part"] == "catback"

    # Confirming the same card again records nothing twice.
    again = confirm(loop, corrected)
    assert again["installs"] == []


def test_confirming_the_first_card_records_no_install(loop: Loop):
    card = draft(loop)
    out = confirm(loop, card["fields"])
    assert out["installs"] == [], "nothing changed, so nothing was fitted or removed"


def test_confirming_an_unknown_part_says_which_parts_it_knows(loop: Loop):
    card = draft(loop)
    fields = dict(card["fields"])
    fields["parts"] = ["turbo"]

    response = post(loop, "/api/profile", {"fields": fields})
    assert response.status_code == 400
    assert "turbo" in response.json()["detail"]
    assert "intake" in response.json()["detail"]
    assert loop.get("/api/state").json()["carProfile"] is None, "a rejected card saves nothing"


# -- no key: the plain form with the same fields
def test_no_key_setup_falls_back_to_a_plain_form_with_the_same_fields(loop: Loop):
    body = loop.get("/api/state").json()
    assert body["hasLlm"] is False, "no key in this test: the form is the setup"
    spec = body["profileSpec"]

    card = draft(loop)
    assert set(spec["fields"]) | {"parts"} == set(card["fields"])
    assert set(card["fields"]["parts"]) <= set(spec["parts"])
    assert spec["parts"] == ["intake", "downpipe", "front-pipe", "catback", "intercooler", "cvt-cooler"]
    assert spec["basemap"] == "Starter 21 Dual Tune 2"
    assert card["fields"]["basemap"] == spec["basemap"], "prefilled on the card, prefilled on the form"


# -- Installs appear in the Car history and start the window like a Flash
def test_an_install_appears_in_the_car_history_and_starts_the_window(loop: Loop):
    first = loop.upload_and_reply("aug22-0903")
    second = loop.upload_and_reply("aug22-0950")
    before = drive_start(loop, second.snapshot()["drive"]["id"])

    out = install(loop, "downpipe", before + 3_600_000)
    assert out["line"] == "Install recorded: downpipe fitted on 22 Aug."

    third = loop.upload_and_reply("aug23-1959")
    assert third.card["window"] == "based on your 1 Drive since the downpipe Install on 22 Aug"

    # The Install sits in the Car history the reply was read against.
    history = [s for s in third.harness_steps() if s["name"] == "carHistory"][0]["output"]
    assert [r["part"] for r in history["installs"]] == ["downpipe"]
    state = loop.get("/api/state").json()
    assert [r["part"] for r in state["installs"]] == ["downpipe"]
    assert state["driveWindow"]["line"] == third.card["window"]
    assert state["driveWindow"]["since"] == {"kind": "install", "label": "the downpipe Install", "day": "22 Aug"}

    # The two Drives from before the Install are out of the window — and the
    # first reply, with no Install yet, still reads the old line.
    assert first.window == "based on this Drive only (22 Aug 09:03)"
    assert second.window == "based on your 2 Drives, 22 Aug 09:03 to 22 Aug 09:50"


def test_a_flash_starts_the_window_the_same_way(loop: Loop):
    loop.upload_and_reply("aug22-0903")
    loop.upload_and_reply("aug22-0950")

    flashed = loop.run(
        loop.worker.call(
            "recordFlash",
            state=loop.store.car_state(None),
            flash={"time": drive_start(loop, "20260822-095021") + 3_600_000, "map": "Starter 21 r2", "changed": "other"},
            now=1756723200000,
        )
    )
    loop.store.save_car_state(flashed["state"])

    third = loop.upload_and_reply("aug23-1959")
    assert third.card["window"] == "based on your 1 Drive since the Flash on 22 Aug"


# -- Drives outside the window never decide the Next step
def test_drives_outside_the_window_dont_change_the_next_step(tmp_path):
    """Two cars, one difference: the first never saw the oldest Drive.

    Both fit a downpipe between the same two Drives and then log the same
    third one. The window, the Next step, what it settled and the Flash plan
    are identical — the Drive outside the window decided nothing.
    """
    with_history = Loop(tmp_path / "with").start()
    without_history = Loop(tmp_path / "without").start()
    try:
        with_history.upload_and_reply("aug22-0903")
        for car in (with_history, without_history):
            car.upload_and_reply("aug22-0950")

        install_at = None
        for car in (with_history, without_history):
            state = car.store.car_state(None)["drives"]
            newest = max(state.values(), key=lambda d: d["start"])
            install_at = newest["start"] + 3_600_000
            response = car.run(
                car._client.post("/api/installs", json={"part": "downpipe", "installed_at": install_at})
            )
            assert response.status_code == 200, response.text

        got = {}
        for name, car in (("with", with_history), ("without", without_history)):
            reply = car.upload_and_reply("aug23-1959")
            step = reply.card["nextStep"]
            plan = reply.card["flashPlan"]
            got[name] = (
                reply.card["window"],
                (step["key"], step["kind"], step["title"], step["uploadWhen"]),
                [(r["key"], r["status"]) for r in reply.card["settled"]],
                (plan["kind"], plan["headline"]),
            )
        assert got["with"][0] == "based on your 1 Drive since the downpipe Install on 22 Aug"
        assert got["with"] == got["without"]
    finally:
        with_history.close()
        without_history.close()


def test_the_window_is_capped_at_fourteen_days():
    rows = [{"id": f"d{i:02d}", "start": i * DAY_MS} for i in range(21)]
    win = W.drive_window(rows, [], [], "d20")
    assert win["since"] is None
    assert [i for i in win["ids"]] == [f"d{i:02d}" for i in range(6, 21)]

    # A change newer than the latest Drive explains nothing yet: no boundary.
    win = W.drive_window(rows, [], [{"installed_at": 21 * DAY_MS, "part": "downpipe"}], "d20")
    assert win["since"] is None

    # The last change wins; an older Flash and the 14-day cap both fall away.
    win = W.drive_window(
        rows,
        [{"time": 10 * DAY_MS, "map": "Starter 21 r2"}],
        [{"installed_at": 18 * DAY_MS, "part": "downpipe"}],
        "d20",
    )
    assert win["ids"] == ["d19", "d20"]
    assert win["since"] == {"kind": "install", "time": 18 * DAY_MS, "part": "downpipe"}


def test_the_windowed_state_keeps_flashes_and_drops_old_drives():
    state = {
        "drives": {"a": {"start": 1}, "b": {"start": 2}},
        "flashes": [{"id": "f1", "time": 1}],
        "hidden": [],
        "mapVersions": [{"n": 1}],
    }
    out = W.windowed_state(state, ["b"])
    assert set(out["drives"]) == {"b"}
    assert out["flashes"] == [{"id": "f1", "time": 1}]
    assert state["drives"].keys() == {"a", "b"}, "the history itself is never filtered"


# -- with no Drive, a tuning question is answered with "upload a drive first"
def test_with_no_drive_a_tuning_question_is_answered_with_upload_a_drive_first(loop: Loop):
    response = post(loop, "/api/ask", {"text": "Why is my car slower in the heat?"})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["kind"] == "no-drive"
    assert body["answer"].startswith("Upload a Drive first")


def test_with_no_drive_setup_still_runs(loop: Loop):
    assert loop.get("/api/state").json()["hasDrives"] is False
    # The setup flow fills the card with no Drive anywhere.
    response = post(loop, "/api/ask", {"flow": "setup", "text": DESCRIPTION})
    assert response.status_code == 200, response.text
    assert response.json()["draft"]["fields"]["model"] == "Civic FE 1.5T"
    # …and confirming saves it, still with no Drive.
    out = confirm(loop, draft(loop)["fields"])
    assert out["profile"]["model"] == "Civic FE 1.5T"


def test_with_drives_a_typed_question_states_its_window(loop: Loop):
    loop.upload_and_reply("aug22-0903")
    response = post(loop, "/api/ask", {"text": "Why is my Knock Control high in traffic?"})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["kind"] == "answer"
    assert body["window"] == "based on this Drive only (22 Aug 09:03)"


# -- every new line the owner reads, in CONTEXT.md's words
def test_every_new_line_uses_the_words_context_allows(loop: Loop):
    loop.upload_and_reply("aug22-0903")
    loop.upload_and_reply("aug22-0950")
    start = drive_start(loop, "20260822-095021")
    lines = [
        C.window_line_for(["20260823-195901", "20260823-203853"], None),
        C.window_line_for(["20260823-203853"], {"kind": "flash", "time": start, "part": None}),
        C.window_line_for(
            ["20260823-203853"], {"kind": "install", "time": start, "part": "front-pipe"}
        ),
        confirm(loop, draft(loop)["fields"])["line"],
        install(loop, "downpipe", start + 3_600_000)["line"],
        post(loop, "/api/ask", {"text": "Why is my Knock Control high?"}) .json()["answer"],
    ]
    assert lines[1].startswith("based on your 1 Drive since the Flash on ")
    assert lines[2].startswith("based on your 1 Drive since the front pipe Install on ")
    blob = "\n".join(lines).lower()
    for word in BANNED:
        assert word not in blob, f"'{word}' in {lines}"
    for word in ("session", "tune", "revision", "mod ", "upgrade", "garage"):
        assert word not in blob, f"'{word}' in {lines}"


def test_state_carries_the_first_log_guide(loop: Loop):
    """Chat CA-08: before any Drive the chat can say how to log one, in the engine's own words."""
    guide = loop.get("/api/state").json()["logGuide"]
    assert guide["title"] == "One Cool drive with 2 pulls"
    assert len(guide["recipe"]["steps"]) >= 3
    assert "AFR Command" in " ".join(guide["recipe"]["steps"])
    assert [row["gauge"] for row in guide["gauges"]["rows"]] == ["IAT2", "Knock Control", "O2 (AFR) at full throttle", "STFT B1 + LTFT B1"]
