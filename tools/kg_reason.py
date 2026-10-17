"""Reasoning over the generated knowledge graph: what the agent's `knowledge_for` tool would do.

Reads only `docs/knowledge-graph/graph.json` and the cards it points to. Nothing here decides a
verdict or writes a map cell (ADR 0005): it finds what a question or a Drive is about, which cards
explain it, and which branch of the tuner's decision tree it lands on. Every step is a graph edge,
so every answer can be traced.

    ask(graph, "Can I add 2 psi?")          -> a situation: entities, cards, decision, tree, trace
    checks(graph)                           -> conflicts (errors) and gaps (warnings)
    evaluate(graph)                         -> scenario + drive scores, KG vs keyword search
"""

from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KG_DIR = ROOT / "docs" / "knowledge-graph"
SCENARIOS_PATH = KG_DIR / "scenarios.json"
DRIVES_PATH = KG_DIR / "drives.json"

# Ranking weights for a card linked to what the question names (tuned by the eval loop, see README).
KEYWORD_SCALE = 20  # the best keyword match for a question scores this much
# A card linked to what the question names; `branch` = the method on the decision's taken branch (the reason
# for the decision, so it ranks with the best keyword match); `stage` = the shop-round stage's method cards.
WEIGHTS = {"table": 6, "family": 4, "term": 2, "mod": 6, "trait": 6, "branch": KEYWORD_SCALE, "stage": 6,
           "superseded": 2}
TOP_K = 5
PHRASES = {"fuel trim": "trim"}  # the trims channel, not fuel: "are my fuel trims OK?" is an airflow question
MOD_STOP = {"front", "mount", "charge", "vendor", "flow"}  # title words too common to name a part
# Where a decision lands in the shop round (knowledge/playbook.md stage ids).
STAGE_OF = {"fix-log": "read", "stop": "undo", "next-step": "log", "teach-only": "mixture",
            "play:airflow": "airflow", "play:mixture": "mixture", "play:boost": "boost"}
# Gates: the eval fails below these.
GATES = {"kg_recall_at_5": 0.9, "decision_accuracy": 0.9, "drive_pass_rate": 1.0}


def _load_knowledge():
    """server/kta_server/knowledge.py, the agent's own card loader and keyword search (the baseline)."""
    spec = importlib.util.spec_from_file_location("kta_knowledge", ROOT / "server" / "kta_server" / "knowledge.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


K = _load_knowledge()


class Graph:
    def __init__(self, data: dict) -> None:
        self.data = data
        self.nodes = {n["id"]: n for n in data["nodes"]}
        self.out: dict[str, list[dict]] = {}
        self.inn: dict[str, list[dict]] = {}
        for e in data["edges"]:
            self.out.setdefault(e["from"], []).append(e)
            self.inn.setdefault(e["to"], []).append(e)
        self.cards = {c["id"]: c for c in K.load_cards()}
        self.cards.update({p["id"]: {**p, "kind": "proposal", "body": p.get("claim", "")} for p in K.proposals()})
        self.idf = idf_of(self)

    @classmethod
    def load(cls, path: Path = KG_DIR / "graph.json") -> "Graph":
        return cls(json.loads(path.read_text(encoding="utf-8")))

    def of_kind(self, kind: str) -> list[dict]:
        return [n for n in self.nodes.values() if n["kind"] == kind]

    def linked(self, nid: str, kinds: set[str], direction: str = "out") -> list[dict]:
        edges = self.out if direction == "out" else self.inn
        return [e for e in edges.get(nid, []) if e["kind"] in kinds]


# ---------------------------------------------------------------------------
# 1. What does the question name?
# ---------------------------------------------------------------------------

def link_entities(g: Graph, text: str) -> list[dict]:
    low = text.lower()
    words = set(words_of(text))
    found: list[dict] = []
    for n in g.of_kind("table"):
        if n["description"].lower() in low:
            found.append({"id": n["id"], "kind": "table", "why": f"names {n['description']}"})
    for n in g.of_kind("family"):
        hit = sorted(words & set(n.get("words", [])))
        if hit:
            found.append({"id": n["id"], "kind": "family", "why": f"says {', '.join(hit)}"})
    family_words = set().union(*(set(f.get("words", [])) for f in g.of_kind("family")))
    for n in g.of_kind("mod"):
        own = {w for w in re.findall(r"[a-z0-9]+", n["label"].lower()) if len(w) >= 5}
        hit = sorted(words & (own - family_words - MOD_STOP - STOP))
        if hit:
            found.append({"id": n["id"], "kind": "mod", "why": f"names the part ({', '.join(hit)})"})
    for n in g.of_kind("trait"):
        own = {n["id"].split(":")[1]} | {w for w in re.findall(r"[a-z0-9]+", n["label"].lower()) if len(w) >= 4}
        hit = sorted(words & (own - family_words - STOP))
        if hit:
            found.append({"id": n["id"], "kind": "trait", "why": f"car character ({', '.join(hit)})"})
    said = " " + " ".join(words_of(text)) + " "
    for n in g.of_kind("term"):
        if " " + " ".join(words_of(n["label"])) + " " in said:
            found.append({"id": n["id"], "kind": "term", "why": f"uses the term {n['label']}"})
    return found


def families_of(g: Graph, entities: list[dict]) -> list[str]:
    """Families the situation touches: named directly, through a table, or through the tables a named part changes."""
    fams = []
    for e in entities:
        if e["kind"] == "family":
            found = [e["id"]]
        elif e["kind"] == "table":
            found = [f"family:{g.nodes[e['id']]['family']}"]
        elif e["kind"] == "mod":
            found = [f"family:{g.nodes[x['to']]['family']}" for x in g.linked(e["id"], {"changes"})]  # not "checks"
        else:
            found = []
        fams += [f for f in found if f not in fams]
    return fams


def mods_for(g: Graph, entities: list[dict], fams: list[str]) -> list[dict]:
    """Parts that bear on it: named by the owner, or changing a table in the families involved. Best score first."""
    named = {e["id"] for e in entities if e["kind"] == "mod"}
    out = []
    for n in g.of_kind("mod"):
        touches = {f"family:{g.nodes[e['to']]['family']}" for e in g.linked(n["id"], {"changes"})}
        if n["id"] in named or touches & set(fams):
            out.append({"id": n["id"], "title": n["label"], "score": n["score"], "gain": n.get("gain"),
                        "change": n.get("description"), "prove": n.get("prove"), "named": n["id"] in named,
                        "not_for_this_car": n.get("not_for_this_car", False),
                        "tables": [{"id": e["to"], "what": e.get("note")} for e in g.linked(n["id"], {"changes"})]})
    return sorted(out, key=lambda m: (not m["named"], m["not_for_this_car"], -m["score"]))


# ---------------------------------------------------------------------------
# 2. Which cards explain it? Keyword score (the agent's search today) + graph links.
# ---------------------------------------------------------------------------

STOP = set("""a an the i me my you your it its is are am be was were do does did can could should would will
to of in on at by for from with and or so if when what how why which who that this there here about still get give
just now any some more much very not no yes than then""".split())


def words_of(text: str) -> list[str]:
    """Whole words, light stemming (trims -> trim, installed -> install). The agent's search counts substrings, so `i` matches
    every card; this one doesn't."""
    low = text.lower()
    for phrase, word in PHRASES.items():
        low = low.replace(phrase, word)
    return [stem(w) for w in re.findall(r"[a-z0-9]+(?:\.[0-9]+)?", low)]  # 0.65 stays one word; "intake." doesn't


def stem(w: str) -> str:
    if len(w) > 6 and w.endswith("ed"):
        return w[:-2]
    return w[:-1] if len(w) > 4 and w.endswith("s") else w


FIELDS = {"title": 3, "applies-when": 2, "topics": 2, "body": 1}


def card_words(card: dict) -> dict[str, list[str]]:
    return {k: words_of(" ".join(card.get(k) or []) if k == "topics" else str(card.get(k) or "")) for k in FIELDS}


def keyword_score(card: dict, query: str, idf: dict[str, float]) -> float:
    """Whole-word matches, weighted by field (title, applies-when, topics, body) and by how rare the word is."""
    fields = card_words(card)
    return round(sum(idf.get(t, 0) * sum(w * fields[k].count(t) for k, w in FIELDS.items())
                     for t in set(words_of(query)) - STOP), 1)


def idf_of(g: "Graph") -> dict[str, float]:
    import math
    docs = [set(sum(card_words(c).values(), [])) for c in g.cards.values()]
    df: dict[str, int] = {}
    for d in docs:
        for w in d:
            df[w] = df.get(w, 0) + 1
    return {w: math.log(1 + len(docs) / n) for w, n in df.items()}


def rank_cards(g: Graph, text: str, entities: list[dict], branch: set[str] = frozenset(),
               stage: set[str] = frozenset()) -> tuple[list[dict], list[dict]]:
    """Top cards with the reasons each one scored, plus the graph edges that carried them. `tree_refs` are the
    cards the decision tree's taken branch points at: the method that applies here, so they rank up."""
    # Parts and car traits point at their cards (explained-by); tables, families and terms are pointed at by cards.
    via = {e["to"]: e for ent in entities if ent["kind"] in ("mod", "trait")
           for e in g.linked(ent["id"], {"explained-by", "method"})}
    linked = {e["id"]: e for e in entities}
    scores: dict[str, float] = {}
    why: dict[str, list[str]] = {}
    trace: list[dict] = []
    raw = {cid: keyword_score(card, text, g.idf) for cid, card in g.cards.items()}
    top_kw = max(raw.values(), default=0) or 1
    for cid, card in g.cards.items():
        nid = f"card:{cid}"
        kw = round(KEYWORD_SCALE * raw[cid] / top_kw, 1)  # the best keyword match scores KEYWORD_SCALE
        bonus = 0
        if nid in branch:
            bonus += WEIGHTS["branch"]
            why.setdefault(cid, []).append("the decision's reason")
        elif nid in stage:
            bonus += WEIGHTS["stage"]
            why.setdefault(cid, []).append("the shop-round stage's method")
        kinds_seen = set()
        for e in g.linked(nid, {"about", "uses-term"}):
            kind = g.nodes[e["to"]]["kind"] if e["to"] in linked else None
            if kind and kind not in kinds_seen:  # one bonus per kind: a card about three named families isn't 3x better
                kinds_seen.add(kind)
                bonus += WEIGHTS[kind]
                why.setdefault(cid, []).append(f"{e['kind']} {g.nodes[e['to']]['label']}")
                trace.append(e)
        if nid in via:
            src = via[nid]["from"]
            bonus += WEIGHTS[g.nodes[src]["kind"]]
            why.setdefault(cid, []).append(f"explains {g.nodes[src]['label']}")
            trace.append(via[nid])
        if kw:
            why.setdefault(cid, []).insert(0, f"keywords {kw}")
        if kw or bonus:
            scores[cid] = kw + bonus
    # A superseded card that matches hands its score to the card that replaced it.
    leaders = sorted(scores, key=lambda c: -scores[c])[:3]
    for cid in leaders:
        status = g.cards[cid].get("status", "")
        if status.startswith("superseded-by"):
            successor = status.split()[-1]
            scores[successor] = max(scores.get(successor, 0), scores[cid]) + WEIGHTS["superseded"]
            why.setdefault(successor, []).append(f"replaces {cid}")
            trace.append({"from": f"card:{cid}", "to": f"card:{successor}", "kind": "superseded-by"})
    ranked = sorted((c for c in scores if g.cards[c].get("status") == "current"), key=lambda c: (-scores[c], c))
    top = [{"id": c, "title": g.cards[c]["title"], "kind": g.cards[c]["kind"], "score": round(scores[c], 1),
            "why": why.get(c, [])} for c in ranked[:TOP_K]]
    proposals = [{"id": c, "title": g.cards[c]["title"]} for c in scores if g.cards[c].get("status") == "proposed"]
    keep = {f"card:{c['id']}" for c in top}
    trace = [e for e in trace if e["from"] in keep or e["to"] in keep]
    return top + [{"id": p["id"], "title": p["title"], "kind": "proposal", "score": 0, "why": ["open proposal"]}
                  for p in proposals][:2], trace


# ---------------------------------------------------------------------------
# 3. The decision tree. The same questions a tuner asks, in tune order (kc-tune-order); the engine
#    answers the last one from the Drive (ADR 0005), so for a typed question that branch stays open.
# ---------------------------------------------------------------------------

def decide(g: Graph, fams: list[str], cards: list[dict], drive: dict | None = None,
           named_mods: list[str] = (), tables: list[str] = ()) -> tuple[str, list[dict]]:
    tree: list[dict] = []

    def node(nid, parent, label, kind, taken, refs=(), edge="", method=False):
        """`method`: the refs are the method that applies on this branch (they rank up when it is taken)."""
        tree.append({"id": nid, "parent": parent, "label": label, "kind": kind, "taken": taken,
                     "refs": [r for r in refs if r in g.nodes], "edge": edge, "method": method})

    top = [f"card:{c['id']}" for c in cards if c["kind"] != "proposal"][:3]
    decision = None
    node("root", None, drive["title"] if drive else "The owner asks", "situation", True, top)
    parent, edge, live = "root", "", True
    if drive:
        readable, stop = drive["readable"], drive.get("verdict") == "Stop"
        node("log", "root", "Is the log readable?", "question", True, ["card:kc-log-gate"])
        node("log-no", "log", "No: fix the log first. No map change.", "leaf", not readable,
             ["card:kc-log-gate", "card:kc-drive-brief"], "no", method=True)
        node("safe", "log", "Does the Verdict say Stop?", "question", readable, ["card:kc-tune-order"], "yes")
        node("safe-stop", "safe", "Stop: find the cause before any change; Undo if it followed a Flash.", "leaf",
             readable and stop, ["card:kc-tune-order", "card:kc-trim-cause", "card:kc-shakedown"], "yes", method=True)
        decision = "fix-log" if not readable else "stop" if stop else None
        live = readable and not stop
        # A Drive's family comes only from the engine's Flash plan (ADR 0005), never from words in the step.
        has_plan = bool(drive.get("tables"))
        node("planned", "safe", "Did the engine write a Flash plan?", "question", live, ["card:kc-tune-one-thing"], "no")
        node("next-step", "planned", f"No map change this round. Next step: {drive.get('title')}", "leaf",
             live and not has_plan, top, "no")
        if live and not has_plan:
            decision = "next-step"
        fams = [f"family:{g.nodes['table:' + t]['family']}" for t in drive.get("tables") or []]
        fams = list(dict.fromkeys(fams))
        parent, edge, live = "planned", "yes", live and has_plan

    named = bool(fams)
    node("names", parent, "Does it name a map table or family?", "question", live, fams, edge)
    node("teach", "names", "No: teach from the cards. No map change.", "leaf", live and not named, top, "no")
    if live and not named:
        decision = "teach"
    live = live and named

    # A named table's own role wins over its family's: Final Boost Target is read-only inside the editable boost family.
    def can_edit(f: str) -> bool:
        named = [t for t in tables if g.nodes[t]["family"] == f.split(":")[1]]
        return any(g.nodes[t]["role"] == "edit" for t in named) if named else g.nodes[f].get("role") == "edit"

    editable = [f for f in fams if can_edit(f)]
    read_only = [f for f in fams if f not in editable]
    node("role", "names", "Can that table change? (editable_tables)", "question", live,
         ["threshold:editable_tables", "threshold:forbidden_tables"], "yes")
    ro_cards = [e["to"] for f in read_only for e in g.linked(f, {"explained-by"})]
    named_ro = sorted({g.nodes[t]["description"] for t in tables if g.nodes[t]["role"] != "edit"})
    what = ", ".join(named_ro or [g.nodes[f]["description"] for f in read_only]) or "it"
    node("read-only", "role", f"No: {what} is read-only here. Explain it; no map change.", "leaf",
         live and not editable, read_only + ro_cards, "read-only", method=True)
    if live and not editable:
        decision = "read-only"
    live = live and bool(editable)

    chosen = min(editable, key=lambda f: g.nodes[f]["tune_order"]) if editable else None
    node("order", "role", "One family per Flash: which comes first in tune order?", "question", live,
         ["threshold:one_family_per_flash", "card:kc-tune-order", "card:kc-tune-one-thing"], "editable",
         method=len(editable) > 1)
    explainer = [e["to"] for e in g.linked(chosen, {"explained-by"})] if chosen else []
    node("family", "order", g.nodes[chosen]["description"] if chosen else "airflow, then mixture, then boost",
         "answer", live, ([chosen] if chosen else []) + explainer, "first", method=True)

    plan_tables = (drive or {}).get("tables") or []
    # A family's Plays: the play cards its shop-round stage uses (knowledge/playbook.md), plus a named part's step.
    stage = f"stage:{chosen.split(':')[1]}" if chosen else None
    plays = [e["to"] for e in g.linked(stage, {"method"}) if g.nodes[e["to"]].get("card_kind") == "play"] if stage else []
    plays += [m for m in named_mods if chosen and any(g.nodes[e["to"]]["family"] == chosen.split(":")[1]
                                                      for e in g.linked(m, {"changes"}))]
    if plan_tables:
        plays = [f"table:{t}" for t in plan_tables]
    node("play", "family", "Is there a Play, a part's map step, or an engine Flash plan for it?", "question", live,
         plays, method=True)
    node("teach-only", "play", "No: teach-only. No map change.", "leaf", live and not plays, [], "no")
    if live and not plays:
        decision = "teach-only"
    live = live and bool(plays)

    gates = [e["from"] for e in g.linked(chosen, {"bounds"}, "in")] if chosen else []
    node("gates", "play", "Do the engine's gates pass on the latest Drive?", "question", live, gates + plays, "yes")
    passed = None if not drive else bool(plan_tables)
    node("flash", "gates", "Pass: the engine writes the Flash plan cells. A Shakedown drive proves it; "
         "undo = the previous Map version.", "leaf", live and passed is not False,
         ["card:kc-shakedown"] + [f"table:{t}" for t in plan_tables], "pass")
    node("prove", "gates", "Fail or not logged yet: no map change. The Drive brief collects the proof.", "leaf",
         live and passed is not True, ["card:kc-drive-brief"] + gates, "fail")
    if live:
        decision = f"play:{chosen.split(':')[1]}"
    for n in tree:  # an undecided engine branch reads "open", not taken
        if n["id"] in ("flash", "prove") and live and passed is None:
            n["taken"] = "open"
    return decision or "teach", tree


# ---------------------------------------------------------------------------
# 4. One call: question (or Drive) -> situation
# ---------------------------------------------------------------------------

def ask(g: Graph, question: str, drive: dict | None = None, sid: str = "ask") -> dict:
    # A Drive's explanation text carries old context; what it is about is its Next step and that step's Open step.
    entities = link_entities(g, drive_headline(drive) if drive else question)
    if drive and drive.get("tables"):
        entities += [{"id": f"table:{t}", "kind": "table", "why": "in the engine's Flash plan"} for t in drive["tables"]]
    fams = families_of(g, entities)
    mods = [e["id"] for e in entities if e["kind"] == "mod"]
    tables = [e["id"] for e in entities if e["kind"] == "table"]
    cards, _ = rank_cards(g, question, entities)
    decision, tree = decide(g, fams, cards, drive, mods, tables)
    # What ranks up: the method on the taken branch, and the method cards of the shop-round stage it lands on.
    stage = stage_of(g, decision, fams, tree)
    branch = {r for n in tree if n["taken"] is True and n["method"] for r in n["refs"]}
    # Stages the situation lands on or names through the round's own terms ("I installed..." -> intake).
    stages = {stage} | {e["from"] for ent in entities if ent["kind"] == "term"
                        for e in g.linked(ent["id"], {"uses-term"}, "in") if e["from"].startswith("stage:")}
    stage_cards = {e["to"] for st in stages if st in g.nodes for e in g.linked(st, {"method"})}
    cards, card_edges = rank_cards(g, question, entities, branch, stage_cards)
    decision, tree = decide(g, fams, cards, drive, mods, tables)
    trace = [{"from": "question", "to": e["id"], "kind": "names", "why": e["why"]} for e in entities] + card_edges
    for f in fams:
        trace += [e for e in g.linked(f, {"bounds"}, "in")]
    nodes = sorted({t["to"] for t in trace} | {t["from"] for t in trace} - {"question"} |
                   {f"card:{c['id']}" for c in cards} | {r for n in tree if n["taken"] for r in n["refs"]})
    return {"id": sid, "question": question, "drive": drive, "entities": entities, "cards": cards,
            "mods": mods_for(g, entities, fams), "stage": stage if stage in g.nodes else None,
            "decision": decision, "say": next((n["label"] for n in tree if n["kind"] == "leaf" and n["taken"] is True),
                                              "The engine decides on the next Drive: proof first, then the Flash plan."),
            "tree": tree, "trace": trace, "nodes": [n for n in nodes if n in g.nodes]}


def stage_of(g: Graph, decision: str, fams: list[str], tree: list[dict]) -> str | None:
    """The shop-round stage a decision lands on. Read-only lands where its family is read: spark for ignition and
    knock, the family's own stage otherwise (Final Boost Target is read in the boost stage)."""
    if decision == "read-only":
        fam = next((r for n in tree if n["id"] == "read-only" for r in n["refs"] if r.startswith("family:")), None)
        name = fam.split(":")[1] if fam else ""
        stage = "spark" if name in ("ignition", "knock") else name
    else:
        stage = STAGE_OF.get(decision)
    return f"stage:{stage}" if stage and f"stage:{stage}" in g.nodes else None


def drive_headline(drive: dict) -> str:
    return " ".join([drive.get("title") or ""] + [o["title"] for o in drive.get("open_steps", [])
                                                   if o["key"] == drive.get("key")])


def drive_question(drive: dict) -> str:
    current = [o["title"] for o in drive.get("open_steps", []) if o["key"] == drive.get("key")]
    parts = [drive.get("title"), drive.get("body"), drive.get("also"), *current]
    return " ".join(x for x in parts if x)


def situations(g: Graph) -> list[dict]:
    out = [ask(g, s["question"], sid=s["id"]) | {"title": s["question"], "expect": s.get("expect", {}), "group": s["group"]}
           for s in json.loads(SCENARIOS_PATH.read_text(encoding="utf-8"))["scenarios"]]
    if DRIVES_PATH.exists():
        for d in json.loads(DRIVES_PATH.read_text(encoding="utf-8"))["drives"]:
            sit = ask(g, drive_question(d), drive=d, sid=f"drive:{d['id']}")
            out.append(sit | {"title": f"Drive {d['id']}: {d['title']}", "expect": d.get("expect", {}), "group": "Drive (simulated)"})
    return out


# ---------------------------------------------------------------------------
# 5. Checks: conflicts fail the build; gaps are the review list.
# ---------------------------------------------------------------------------

def checks(g: Graph) -> dict:
    errors, gaps = [], []
    for e in g.data["edges"]:
        if e["kind"] == "conflicts":
            errors.append(f"conflict: {e['from']} vs {e['to']} on {e.get('number')}: {e.get('note')}")
        if e["kind"] in ("cites", "about", "uses-term") and g.nodes[e["to"]].get("status", "").startswith("superseded"):
            if g.nodes[e["from"]].get("status") == "current":
                errors.append(f"conflict: current {e['from']} points at superseded {e['to']}")
    for n in g.of_kind("term"):
        if any(ch.isdigit() for ch in n.get("description", "")):
            gaps.append(f"glossary {n['id']} carries a number; ADR 0008: define without numbers, point to the card")
        if not g.inn.get(n["id"]) and not g.out.get(n["id"]):
            gaps.append(f"glossary {n['id']} is used nowhere")
    for f in g.of_kind("family"):
        about = [e["from"] for e in g.linked(f["id"], {"about"}, "in")]
        if f.get("role") == "edit" and not any(g.nodes[c].get("card_kind") == "play" for c in about):
            gaps.append(f"{f['id']} is editable but no current Play card covers it (teach-only)")
        if not about:
            gaps.append(f"{f['id']} has no card explaining it")
    for t in g.of_kind("threshold"):
        if not any(g.nodes[e["from"]]["kind"] == "module" for e in g.linked(t["id"], {"uses"}, "in")):
            gaps.append(f"{t['id']} is read by no engine/server module")
    for n in g.nodes.values():
        if n["kind"] not in ("area",) and not g.inn.get(n["id"]) and not g.out.get(n["id"]):
            gaps.append(f"{n['id']} is linked to nothing")
    proposals = [c for c in g.cards.values() if c.get("status") == "proposed"]
    current = [c for c in g.cards.values() if c.get("status") == "current"]
    for p in proposals:
        pw = set(re.findall(r"[a-z]{4,}", p["title"].lower()))
        for c in current:
            cw = set(re.findall(r"[a-z]{4,}", c["title"].lower()))
            if pw and len(pw & cw) / len(pw | cw) >= 0.5:
                gaps.append(f"proposal {p['id']} may duplicate {c['id']}")
    return {"errors": sorted(set(errors)), "gaps": sorted(set(gaps))}


# ---------------------------------------------------------------------------
# 6. Eval
# ---------------------------------------------------------------------------

def evaluate(g: Graph) -> dict:
    rows = []
    for sit in situations(g):
        expect = sit["expect"]
        want = expect.get("cards", [])
        kg = [c["id"] for c in sit["cards"] if c["kind"] != "proposal"]
        row = {"id": sit["id"], "group": sit["group"], "decision": sit["decision"], "kg_top": kg}
        if want:
            base = [c["id"] for c in K.search(sit["question"])] if not sit["drive"] else []
            row |= {"want": want, "kg_recall": len(set(want) & set(kg)) / len(want),
                    "kw_top": base, "kw_recall": len(set(want) & set(base)) / len(want) if not sit["drive"] else None}
        if "decision" in expect:
            row["decision_ok"] = sit["decision"] == expect["decision"]
            row["want_decision"] = expect["decision"]
        if sit["drive"]:
            plan = sit["drive"].get("tables") or []
            roles = {g.nodes[f"table:{t}"]["role"] for t in plan}
            fams = {g.nodes[f"table:{t}"]["family"] for t in plan}
            row["drive_ok"] = bool(kg) and roles <= {"edit"} and len(fams) <= 1 and row.get("decision_ok", True) \
                and row.get("kg_recall", 1) == 1
        rows.append(row)
    asked = [r for r in rows if "kg_recall" in r and r["kw_recall"] is not None]
    decided = [r for r in rows if "decision_ok" in r]
    drives = [r for r in rows if "drive_ok" in r]
    avg = lambda xs: round(sum(xs) / len(xs), 3) if xs else None
    found = checks(g)
    metrics = {
        "scenarios": len(asked), "drives": len(drives),
        "kg_recall_at_5": avg([r["kg_recall"] for r in asked]),
        "heldout_recall_at_5": avg([r["kg_recall"] for r in asked if r["group"].startswith("Held-out")]),
        "heldout_keyword_recall_at_5": avg([r["kw_recall"] for r in asked if r["group"].startswith("Held-out")]),
        "keyword_recall_at_5": avg([r["kw_recall"] for r in asked]),
        "decision_accuracy": avg([r["decision_ok"] for r in decided]),
        "drive_pass_rate": avg([r["drive_ok"] for r in drives]),
        "conflicts": len(found["errors"]), "gaps": len(found["gaps"]),
    }
    failed = [k for k, floor in GATES.items() if metrics[k] is not None and metrics[k] < floor]
    if found["errors"]:
        failed.append("conflicts")
    return {"metrics": metrics, "failed": failed, "rows": rows, "checks": found}


def impact(before: dict, after: dict) -> list[str]:
    """What a knowledge change did: scenarios whose cards or decision moved (the impact replay, ADR 0008 §3.8)."""
    old = {r["id"]: r for r in before.get("rows", [])}
    lines = []
    for r in after["rows"]:
        o = old.get(r["id"])
        if not o:
            lines.append(f"+ {r['id']}: new scenario")
            continue
        if o["decision"] != r["decision"]:
            lines.append(f"~ {r['id']}: decision {o['decision']} -> {r['decision']}")
        if o["kg_top"][:3] != r["kg_top"][:3]:
            lines.append(f"~ {r['id']}: top cards {o['kg_top'][:3]} -> {r['kg_top'][:3]}")
    return lines


# ---------------------------------------------------------------------------
# 7. Reading it: a trace a person can follow, and the eval run with its history
# ---------------------------------------------------------------------------

HISTORY_PATH = KG_DIR / "eval-history.jsonl"
LATEST_PATH = KG_DIR / "eval-latest.json"


def explain(sit: dict) -> str:
    mark = {True: "●", False: "○", "open": "◐"}
    lines = [f"Q: {sit['question']}", "", "1. What it names (question -> graph)"]
    lines += [f"   {e['id']:<38} {e['why']}" for e in sit["entities"]] or ["   nothing in the map: a teaching answer"]
    lines += ["", "2. Cards that explain it (score: why)"]
    lines += [f"   {c['id']:<30} {c['score']:>5}  {'; '.join(c['why'])}" for c in sit["cards"]]
    lines += ["", "3. The shop's decision tree (● taken, ◐ the engine decides on the next Drive, ○ not taken)"]
    depth = {"root": 0}
    for n in sit["tree"]:
        if n["parent"]:
            depth[n["id"]] = depth[n["parent"]] + 1
            edge = f"[{n['edge']}] " if n["edge"] else ""
            lines.append(f"   {'  ' * depth[n['id']]}{mark[n['taken']]} {edge}{n['label']}")
    if sit.get("stage"):
        lines += ["", f"4. Where it sits in the shop round: {sit['stage']}"]
    if sit.get("mods"):
        lines += ["", "5. Parts that bear on it (score = 3 effect - 2 effort - 2 risk)"]
        lines += [f"   {m['title']} ({m['score']}){' - not for this car' if m['not_for_this_car'] else ''}: {m['change']}"
                  for m in sit["mods"][:3]]
    lines += ["", f"Decision: {sit['decision']}. {sit['say']}"]
    return "\n".join(lines)


def record(metrics: dict, note: str) -> None:
    """Append one line to eval-history.jsonl: the trend the README and the viewer's Health tab show."""
    import datetime
    import subprocess
    sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    with HISTORY_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"date": datetime.date.today().isoformat(), "base": sha, "note": note, **metrics}) + "\n")
    print(f"recorded in {HISTORY_PATH.relative_to(ROOT)}")


def run_eval(g: Graph, record: str | None = None) -> int:
    """Print the scorecard, the impact against the last run, and (with a note) append it to the history."""
    result = evaluate(g)
    m = result["metrics"]
    for r in result["rows"]:
        miss = [c for c in r.get("want", []) if c not in r["kg_top"]]
        bad = "decision_ok" in r and not r["decision_ok"]
        if miss or bad or r.get("drive_ok") is False:
            wrong = f"; decision {r['decision']} != {r['want_decision']}" if bad else ""
            print(f"  FAIL {r['id']:<26} missing {miss or '-'}{wrong}  top {r['kg_top'][:5]}")
    print("\nmetrics:", json.dumps(m))
    for c in result["checks"]["errors"]:
        print("  CONFLICT", c)
    print(f"  {len(result['checks']['gaps'])} gaps (review list): " + "; ".join(result["checks"]["gaps"][:6]) +
          (" ..." if len(result["checks"]["gaps"]) > 6 else ""))
    if LATEST_PATH.exists():
        changes = impact(json.loads(LATEST_PATH.read_text(encoding="utf-8")), result)
        print(f"\nimpact vs last run: {len(changes)} change(s)")
        for line in changes[:30]:
            print("  " + line)
    LATEST_PATH.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    if record:
        globals()["record"](m | {"kind": "graph"}, record)
    print("\nPASS" if not result["failed"] else f"\nFAIL: {', '.join(result['failed'])}")
    return 0 if not result["failed"] else 1



# ---------------------------------------------------------------------------
# 8. The agent arm: does the KG make the LLM decide and cite better? (needs KTA_LLM_* in .env)
# ---------------------------------------------------------------------------

DECISIONS = ["teach", "read-only", "teach-only", "play:airflow", "play:mixture", "play:boost"]
AGENT_RULES = """You are the tuning shop in KTuner Assistant, talking to the owner of one Civic 1.5T CVT on Vietnam E10.
Answer ONLY from the cards given; never invent a number. Reply as JSON:
{"answer": "<= 70 words, plain words", "cites": ["card ids you used"], "decision": "<one of: teach | read-only |
teach-only | play:airflow | play:mixture | play:boost>"}
decision: teach = not a map question, no map change; read-only = it names a table the shop never edits (ignition,
knock sensitivity, protection); teach-only = an editable table with no proven Play yet, no map change;
play:<family> = the change goes through that family's Play, only when the engine's gates pass on the next Drive."""


def _env() -> dict:
    env = {}
    path = ROOT / ".env"
    for line in path.read_text(encoding="utf-8").splitlines() if path.exists() else []:
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"')
    return env


def _chat(env: dict, system: str, user: str) -> dict:
    import urllib.request
    body = json.dumps({"model": env["KTA_LLM_MODEL"], "temperature": 0,
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]})
    req = urllib.request.Request(env["KTA_LLM_BASE_URL"].rstrip("/") + "/chat/completions", data=body.encode(),
                                 headers={"content-type": "application/json",
                                          "authorization": f"Bearer {env['KTA_LLM_API_KEY']}"})
    with urllib.request.urlopen(req, timeout=120) as r:
        text = json.loads(r.read())["choices"][0]["message"]["content"]
    match = re.search(r"\{.*\}", text, re.S)
    return json.loads(match.group(0)) if match else {}


def packet(g: Graph, sit: dict | None, cards: list[str]) -> str:
    """What the agent is given: the cards (and, with the KG, the trace and the decision tree's branch)."""
    lines = [f"[{c}] {g.cards[c]['title']}: {g.cards[c]['body']}" for c in cards]
    if sit:
        lines += ["", "Knowledge graph trace:",
                  "names: " + ", ".join(f"{e['id']} ({e['why']})" for e in sit["entities"]) or "nothing in the map",
                  "decision tree: " + " -> ".join(n["label"] for n in sit["tree"] if n["taken"] is True and n["parent"]),
                  f"where in the shop round: {g.nodes[sit['stage']]['label'] if sit.get('stage') else '-'}"]
    return "\n".join(lines)


def llm_eval(g: Graph, workers: int = 6) -> dict:
    """Agent + KG vs agent + keyword search, same model, same questions. Returns per-arm scores."""
    from concurrent.futures import ThreadPoolExecutor
    env = _env()
    sits = [s for s in situations(g) if not s["drive"]]

    def run(sit):
        out = {}
        kg_cards = [c["id"] for c in sit["cards"] if c["kind"] != "proposal"][:TOP_K]
        kw_cards = [c["id"] for c in K.search(sit["question"])][:TOP_K]
        for arm, given, trace in (("kg", kg_cards, sit), ("keyword", kw_cards, None)):
            text = packet(g, trace, given)
            try:
                reply = _chat(env, AGENT_RULES, f"Owner: {sit['question']}\n\nCards:\n{text}")
            except Exception as exc:  # a failed call is scored as a miss, and said
                reply = {"answer": f"(call failed: {exc})", "cites": [], "decision": ""}
            plain = lambda t: re.sub(r"(?<=\d),(?=\d{3})", "", t)  # 1,700 and 1700 are the same number
            nums = re.findall(r"\d+(?:\.\d+)?", plain(reply.get("answer", "")))
            want = sit["expect"]
            out[arm] = {
                "decision_ok": reply.get("decision") == want["decision"] if "decision" in want else None,
                "cites_expected": bool(set(reply.get("cites") or []) & set(want.get("cards", []))),
                "cites_grounded": set(reply.get("cites") or []) <= set(given),
                "numbers_grounded": all(n in plain(text) or n in plain(sit["question"]) for n in nums),
                "reply": reply,
            }
        return sit["id"], out

    with ThreadPoolExecutor(workers) as pool:
        rows = dict(pool.map(run, sits))
    avg = lambda arm, key: round(sum(r[arm][key] for r in rows.values() if r[arm][key] is not None) /
                                 max(1, sum(r[arm][key] is not None for r in rows.values())), 3)
    keys = ("decision_ok", "cites_expected", "cites_grounded", "numbers_grounded")
    return {"model": env.get("KTA_LLM_MODEL"), "n": len(rows),
            "arms": {arm: {k: avg(arm, k) for k in keys} for arm in ("kg", "keyword")}, "rows": rows}
