#!/usr/bin/env python3
"""The software knowledge graph: what each part of KTuner Assistant is and how the parts connect.

Generated, never hand-edited (the same rule as ADR 0008 for tuning knowledge): every node and edge
is read from what already holds the fact — source imports, FastAPI routes, the chat's fetch calls,
ADR/research/card cross-references, CONTEXT.md terms. What static reading can't see goes in
`docs/knowledge-graph/overlay.json`, by hand, and every id there must resolve or the build fails.

    python3 tools/knowledge-graph.py            write docs/knowledge-graph/graph.json
    python3 tools/knowledge-graph.py --check    exit 1 if graph.json is stale or the overlay dangles
    python3 tools/knowledge-graph.py --serve    write, then serve the viewer on http://localhost:8765

Stdlib only, so it runs anywhere the repo is checked out.
"""

from __future__ import annotations

import ast
import fnmatch
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "knowledge-graph"
GRAPH_PATH = OUT_DIR / "graph.json"
OVERLAY_PATH = OUT_DIR / "overlay.json"

# Area -> (globs, one-line role). The README "How it works" table overrides a role when it names the part.
AREAS: dict[str, tuple[list[str], str]] = {
    "engine": (["engine/*.js", "engine/text/*.js"], "Tuning engine (JavaScript)"),
    "worker": (["server/kta_worker/*.js"], "Node process that runs the engine"),
    "server": (["server/kta_server/*.py"], "Python server"),
    "web": (["web/app/*.tsx", "web/components/*.tsx", "web/lib/*.ts"], "Next.js chat"),
    "tests": (["test/*.js", "server/tests/**/*.py", "web/e2e/*.js"], "Engine, server and browser tests"),
    "tools": (["tools/*.js", "tools/*.py"], "Repo scripts"),
    "data": (["data/*.json", "data/*.js", "data/*.xlsx", "knowledge/index.json"], "Map data, thresholds, example drives"),
    "knowledge": (["knowledge/cards/*.md", "knowledge/proposed/*.md"], "Sourced knowledge cards"),
    "docs": (["*.md", "docs/adr/*.md", "docs/research/*.md"], "Product, design, glossary, ADRs, research"),
}
README_PARTS = {"Engine": "engine", "Worker": "worker", "Server": "server", "Chat": "web", "Knowledge": "knowledge"}
SELF = {"tools/knowledge-graph.py"}  # never a node: it would mention every path it scans

# Tuning layer. Families, their tables, what they do and why they are locked come from the map tour
# (server/kta_server/tour.py, in tune order); edit / read-only per table from thresholds.json. Only the
# words owners use for each family live here, for linking questions and cards to it.
WORDS: dict[str, set[str]] = {
    "airflow": {"maf", "afm", "airflow", "intake", "housing", "trim", "trims"},
    "mixture": {"afr", "lambda", "mixture", "wot", "rich", "lean"},
    "boost": {"boost", "psi", "turbo", "wastegate", "overshoot"},
    "ignition": {"timing", "ignition", "spark", "advance"},
    "knock": {"knock"},
    "basemap": {"rail", "difp", "vtc"},
}
FALLBACK_FAMILY = {"Boost_Target": "boost", "AFM_Flow": "airflow"}  # tables the tour doesn't list
THRESHOLD_FAMILY = {"boost": "boost", "maf": "airflow", "wot": "mixture"}  # by key prefix
PLAYBOOK = ROOT / "knowledge" / "playbook.md"

CODE_EXT = {".py", ".js", ".ts", ".tsx"}
ROUTE_DECORATOR = re.compile(r"@app\.(get|post|put|patch|delete)\(\s*[\"']([^\"']+)")
ROUTE_ENDPOINT = re.compile(r"add_langgraph_fastapi_endpoint\([^)]*path\s*=\s*[\"']([^\"']+)")
WEB_ROUTE = re.compile(r"(?:\$\{SERVER_URL\}|[\"'`]|:\d{2,5})(/(?:api|upload|healthz|agent)\b[A-Za-z0-9_/\-]*)")
JS_REQUIRE = re.compile(r"require\(\s*(?:path\.join\(__dirname,\s*([^)]*)\)|[\"']([^\"']+)[\"'])")
TS_IMPORT = re.compile(r"(?:from|import)\s+[\"'](\.{1,2}/[^\"']+)[\"']")
ADR_REF = re.compile(r"\bADR[ -]?(\d{4})\b|docs/adr/(\d{4})-")
CARD_REF = re.compile(r"\bk[cp]-[a-z0-9]+(?:-[a-z0-9]+)*\b")
TERM = re.compile(r"^\*\*(.+?)\*\*:\s*$")


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def first_line(text: str) -> str:
    """The first sentence-ish line of a module docstring, leading comment or Markdown H1."""
    for line in text.splitlines():
        line = line.strip().strip('"').strip("/*!").strip("#").strip()
        if len(line) > 3 and not line.startswith(("use client", "@", "eslint", "from __future__")):
            return line[:200]
    return ""


def collect_files() -> dict[str, str]:
    """path -> area, for every file the globs match."""
    files: dict[str, str] = {}
    for area, (globs, _) in AREAS.items():
        for g in globs:
            for p in sorted(ROOT.glob(g)):
                r = rel(p)
                if p.is_file() and r not in SELF and "__pycache__" not in r and r not in files:
                    files[r] = area
    return files


class Graph:
    def __init__(self) -> None:
        self.nodes: dict[str, dict] = {}
        self.edges: dict[tuple[str, str, str], dict] = {}

    def node(self, nid: str, kind: str, label: str, **attrs) -> None:
        self.nodes[nid] = {"id": nid, "kind": kind, "label": label, **{k: v for k, v in attrs.items() if v not in ("", None, [])}}

    def edge(self, src: str, dst: str, kind: str, **attrs) -> None:
        if src != dst and src in self.nodes and dst in self.nodes:
            self.edges.setdefault((src, dst, kind), {"from": src, "to": dst, "kind": kind, **attrs})


# ---------------------------------------------------------------------------
# Readers. Each one adds nodes or edges from one kind of source.
# ---------------------------------------------------------------------------

def add_areas(g: Graph) -> None:
    roles = {area: role for area, (_, role) in AREAS.items()}
    for line in (ROOT / "README.md").read_text(encoding="utf-8").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) == 3 and cells[0] in README_PARTS:
            roles[README_PARTS[cells[0]]] = f"{cells[0]}: owns {cells[2]}"
    for area, role in roles.items():
        g.node(f"area:{area}", "area", area, description=role)


def add_files(g: Graph, files: dict[str, str]) -> None:
    for path, area in files.items():
        p = ROOT / path
        ext = p.suffix
        if path.startswith("knowledge/") and ext == ".md":
            continue  # cards are their own nodes
        if area == "data":
            kind = "data"
        elif ext in CODE_EXT:
            kind = "test" if area == "tests" else "module"
        elif path.startswith("docs/adr/"):
            kind = "adr"
        else:
            kind = "doc"
        text = p.read_text(encoding="utf-8", errors="replace") if ext != ".xlsx" else ""
        if kind == "adr":
            nid = f"adr:{p.name[:4]}"
            g.node(nid, kind, f"ADR {p.name[:4]}", area=area, path=path, description=first_line(text))
        else:
            desc = first_line(text) if kind in ("module", "test", "doc") else ""
            g.node(f"file:{path}", kind, p.name, area=area, path=path, description=desc,
                   lines=text.count("\n") + 1 if text else None)


def add_cards(g: Graph) -> None:
    for folder in ("cards", "proposed"):
        for p in sorted((ROOT / "knowledge" / folder).glob("*.md")):
            front = p.read_text(encoding="utf-8").split("---")[1]
            f = dict(m.groups() for m in re.finditer(r"^([a-z-]+):\s*(.*?)\s*$", front, re.M))
            body = "---".join(p.read_text(encoding="utf-8").split("---")[2:]).strip()
            g.node(f"card:{f.get('id', p.stem)}", "card", f.get("id", p.stem), area="knowledge", path=rel(p),
                   description=f.get("title", ""), status=f.get("status", ""), card_kind=f.get("kind", ""),
                   topics=f.get("topics", ""), applies_when=f.get("applies-when", ""), body=body,
                   source=" ".join(x for x in (f.get("source-doc"), f.get("source-section")) if x))


def add_terms(g: Graph) -> dict[str, str]:
    """CONTEXT.md glossary: `**Term**:` then its definition. Returns term -> definition."""
    terms: dict[str, str] = {}
    section, current = "", None
    for line in (ROOT / "CONTEXT.md").read_text(encoding="utf-8").splitlines():
        if line.startswith("### "):
            section = line[4:].strip()
        elif m := TERM.match(line):
            current = m.group(1)
            terms[current] = ""
            g.node(f"term:{current}", "term", current, area="docs", path="CONTEXT.md", section=section)
        elif current and line.strip() and not terms[current]:
            terms[current] = line.strip()
            g.nodes[f"term:{current}"]["description"] = line.strip()
        elif line.startswith("## "):
            current = None
    return terms


def add_routes(g: Graph, files: dict[str, str]) -> dict[str, str]:
    """FastAPI routes the server serves. Returns route path -> node id."""
    routes: dict[str, set[str]] = {}
    owners: dict[str, str] = {}
    for path in (f for f in files if f.startswith("server/kta_server/")):
        text = (ROOT / path).read_text(encoding="utf-8")
        found = [(m.upper(), r) for m, r in ROUTE_DECORATOR.findall(text)]
        found += [("POST", r) for r in ROUTE_ENDPOINT.findall(text)]
        for method, route in found:
            routes.setdefault(route, set()).add(method)
            owners[route] = path
    for route, methods in routes.items():
        g.node(f"route:{route}", "route", route, area="server", methods=sorted(methods))
        g.edge(f"file:{owners[route]}", f"route:{route}", "serves")
    return {r: f"route:{r}" for r in routes}


def py_imports(path: str, files: dict[str, str]) -> set[str]:
    """Repo files a Python module imports: package-relative, `kta_server.x`, or a sibling test module."""
    p = ROOT / path
    tree = ast.parse(p.read_text(encoding="utf-8"))
    pkg = ROOT / "server" / "kta_server"
    out: set[str] = set()

    def resolve(base: Path, dotted: str) -> None:
        stem = base.joinpath(*dotted.split(".")) if dotted else base
        for cand in (stem.with_suffix(".py"), stem / "__init__.py"):
            if cand.exists() and rel(cand) in files:
                out.add(rel(cand))
                return

    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            if node.level:
                base = p.parent
                for _ in range(node.level - 1):
                    base = base.parent
                targets = [mod] if mod else [a.name for a in node.names]
                for t in targets:
                    resolve(base, t)
            elif mod == "kta_server":
                for a in node.names:
                    resolve(pkg, a.name)
            elif mod.startswith("kta_server."):
                resolve(pkg, mod.split(".", 1)[1])
            else:  # pytest rootdir-style sibling import: `from conftest import Loop`
                for base in (p.parent, ROOT / "server" / "tests"):
                    resolve(base, mod)
        elif isinstance(node, ast.Import):
            for a in node.names:
                if a.name.startswith("kta_server."):
                    resolve(pkg, a.name.split(".", 1)[1])
    return out


def js_imports(path: str, text: str, files: dict[str, str]) -> set[str]:
    p = ROOT / path
    out: set[str] = set()
    specs = []
    for joined, plain in JS_REQUIRE.findall(text):
        if joined:  # path.join(__dirname, '..', 'engine', 'x.js')
            specs.append("/".join(re.findall(r"[\"']([^\"']+)[\"']", joined)))
        elif plain.startswith("."):
            specs.append(plain)
    specs += TS_IMPORT.findall(text)
    for spec in specs:
        base = (p.parent / spec).resolve()
        for cand in (base, base.with_suffix(".ts"), base.with_suffix(".tsx"), base.with_suffix(".js")):
            if cand.is_file() and cand.is_relative_to(ROOT) and rel(cand) in files:
                out.add(rel(cand))
                break
    return out


PY_PATH = re.compile(r"(?:[\"'][\w.-]+[\"']\s*/\s*)+[\"'][\w.-]+[\"']")
JS_PATH_JOIN = re.compile(r"path\.join\(\s*__dirname\s*,([^()]*)\)")
JS_DYNAMIC_REQUIRE = re.compile(r"require\(\s*([^()]*\+[^()]*)\)")


def glob_of(expr: str) -> str:
    """`'example-' + id + '.js'` -> `example-*.js`: literals kept, anything computed becomes *."""
    return "".join(p.strip()[1:-1] if p.strip()[:1] in "'\"" else "*" for p in expr.split("+"))


def path_refs(path: str, text: str, files: dict[str, str]) -> set[str]:
    """Files a module reaches by a built path: Python `ROOT / "a" / "b.json"`, JS `path.join(__dirname, ...)`,
    or a computed `require('../data/example-' + id + '.js')`."""
    if path.endswith(".py"):
        tails = ["/".join(re.findall(r"[\"']([\w.-]+)[\"']", m.group(0))) for m in PY_PATH.finditer(text)]
        return {f for f in files for t in tails if f == t or f.endswith("/" + t)}
    here = Path(path).parent.as_posix()
    patterns = ["/".join(glob_of(a) for a in m.group(1).split(",")) for m in JS_PATH_JOIN.finditer(text)]
    patterns += [glob_of(m.group(1)) for m in JS_DYNAMIC_REQUIRE.finditer(text)]
    globs = [os.path.normpath(f"{here}/{p}") for p in patterns if "." in p.rsplit("/", 1)[-1]]
    return {f for f in files for g in globs if fnmatch.fnmatch(f, g)}


def file_id(g: Graph, path: str) -> str:
    adr = f"adr:{Path(path).name[:4]}"
    return adr if path.startswith("docs/adr/") else f"file:{path}"


def add_code_edges(g: Graph, files: dict[str, str], routes: dict[str, str]) -> None:
    for path, area in files.items():
        ext = Path(path).suffix
        if ext not in CODE_EXT:
            continue
        text = (ROOT / path).read_text(encoding="utf-8")
        src = f"file:{path}"
        targets = py_imports(path, files) if ext == ".py" else js_imports(path, text, files)
        for t in targets:
            kind = "reads" if files[t] == "data" else ("tests" if area == "tests" and files[t] != "tests" else "imports")
            g.edge(src, f"file:{t}", kind)
        for t in path_refs(path, text, files) - targets - {path}:
            g.edge(src, f"file:{t}", "reads" if files[t] == "data" else "loads")
        if area in ("web", "tests"):
            for found in set(WEB_ROUTE.findall(text)):
                for route, rid in routes.items():
                    if route == found or (found.endswith("/") and re.fullmatch(re.escape(found) + r"\{[^}/]+\}", route)):
                        g.edge(src, rid, "calls")


def add_text_edges(g: Graph, files: dict[str, str], terms: dict[str, str]) -> None:
    """Mentions in prose and comments: repo paths, unique file names, ADR numbers, card ids, glossary terms."""
    paths = {p: file_id(g, p) for p in files if not p.startswith("knowledge/")}
    names: dict[str, list[str]] = {}
    for p in paths:
        names.setdefault(Path(p).name, []).append(p)
    unique_names = {n: paths[ps[0]] for n, ps in names.items() if len(ps) == 1 and len(n) >= 7 and n not in {"README.md"}}
    cards = {n["label"]: nid for nid, n in g.nodes.items() if n["kind"] == "card"}

    sources = [(file_id(g, p), p) for p, area in files.items() if area != "data"]
    sources += [(nid, n["path"]) for nid, n in g.nodes.items() if n["kind"] == "card"]
    for src, path in sources:
        text = (ROOT / path).read_text(encoding="utf-8", errors="replace")
        hits: set[str] = set()
        for p, nid in paths.items():
            if p in text:
                hits.add(nid)
        for name, nid in unique_names.items():
            if re.search(r"(?<![\w/.-])" + re.escape(name) + r"\b", text):
                hits.add(nid)
        for a, b in ADR_REF.findall(text):
            hits.add(f"adr:{a or b}")
        for c in CARD_REF.findall(text):
            if c in cards:
                hits.add(cards[c])
        kind = "cites" if g.nodes.get(src, {}).get("kind") == "card" else "mentions"
        for h in hits:
            if h.startswith("file:") and g.nodes.get(h, {}).get("kind") == "data" and src.startswith("file:") and Path(path).suffix in CODE_EXT:
                g.edge(src, h, "reads")
            elif not any((src, h, k) in g.edges for k in ("imports", "tests", "reads")):
                g.edge(src, h, kind)
        # A card's source doc is a stronger link than a mention.
        if src.startswith("card:"):
            m = re.search(r"^source-doc:\s*(\S+)", text, re.M)
            if m and m.group(1) in paths:
                g.edges.pop((src, paths[m.group(1)], "cites"), None)
                g.edge(src, paths[m.group(1)], "sourced-from")
            m = re.search(r"superseded-by\s+(k[cp]-[a-z0-9-]+)", text)
            if m and m.group(1) in cards:
                g.edge(src, cards[m.group(1)], "superseded-by")

    # Glossary: a term whose definition uses another term.
    for term, definition in terms.items():
        for other in terms:
            if other != term and re.search(r"\b" + re.escape(other) + r"\b", definition):
                g.edge(f"term:{term}", f"term:{other}", "uses-term")


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


TOUR = load_module("kta_tour", ROOT / "server" / "kta_server" / "tour.py").FAMILIES


def family_of(table_id: str) -> str:
    fam = next((f["id"] for f in TOUR if table_id in f["tables"]), None)
    return fam or next((f for prefix, f in FALLBACK_FAMILY.items() if table_id.startswith(prefix)), "basemap")


def engine_registry() -> dict:
    """What the engine itself declares: log channels, required channels, mods, vendor claims, their sources."""
    js = ("const E=require('./engine/kta-engine.js'),m=require('./engine/kta-build.js'),B=m.build||m;"
          "process.stdout.write(JSON.stringify({channels:E.CHANNELS,required:E.REQUIRED,"
          "items:B.ITEMS,claims:B.CLAIMS,sources:B.SOURCES}))")
    return json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


def table_group(table_id: str) -> str:
    """`Boost_Target_2_Normal_L` -> `Boost Target 2 Normal`: the name a card or an owner says."""
    return re.sub(r"_(L|H|0pct|55pct)$", "", table_id).replace("_", " ")


def tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def card_numbers(path: Path) -> list[dict]:
    front = path.read_text(encoding="utf-8").split("---")[1]
    return [{"name": m.group(1), "value": float(m.group(2)), "unit": m.group(3)}
            for m in re.finditer(r"^-\s*([A-Za-z0-9_.-]+)\s*:\s*([-+]?[0-9]*\.?[0-9]+)\s+(.+?)\s*$", front, re.M)]


def threshold_value(thresholds: dict, ref: str):
    """`boost_step_gates.kc_max` or `boost_step_max` -> its number, or None if the id doesn't resolve."""
    key, _, leaf = ref.partition(".")
    value = (thresholds.get(key) or {}).get("value") if isinstance(thresholds.get(key), dict) else None
    return value.get(leaf) if leaf and isinstance(value, dict) else (None if leaf else value)


def add_tuning(g: Graph, files: dict[str, str], terms: dict[str, str]) -> None:
    """Map tables, families and thresholds, glued to cards, terms and the code that reads them."""
    maps = json.loads((ROOT / "data" / "ktuner-maps-digitized.json").read_text(encoding="utf-8"))
    thresholds = json.loads((ROOT / "data" / "thresholds.json").read_text(encoding="utf-8"))
    editable = thresholds["editable_tables"]["value"]
    forbidden = set(thresholds["forbidden_tables"]["value"])

    editable_order = [f["id"] for f in TOUR if f["editable"]]
    for f in TOUR:
        g.node(f"family:{f['id']}", "family", f["id"], area="tuning", description=f["title"], what=f["what"],
               role="edit" if f["editable"] else "read-only", locked=f.get("locked"), unlocks=f.get("unlocks"),
               tune_order=editable_order.index(f["id"]) + 1 if f["id"] in editable_order else None,
               words=sorted(WORDS[f["id"]]))
        g.edge(f"family:{f['id']}", f"card:{f['card']}", "explained-by")
    for t, table in maps.items():
        role = "edit" if t in editable else "read-only" if t in forbidden else "untouched"
        values = table.get("values") or [[]]
        g.node(f"table:{t}", "table", t, area="tuning", description=table_group(t), family=family_of(t), role=role,
               note=table.get("notes"), shape=f"{len(values)}×{len(values[0]) if values and isinstance(values[0], list) else 1}")
        g.edge(f"table:{t}", f"family:{family_of(t)}", "in-family")
    for t in maps:
        g.edge("file:data/ktuner-maps-digitized.json", f"table:{t}", "defines")

    for key, entry in thresholds.items():
        if not isinstance(entry, dict):
            continue
        value = entry.get("value")
        g.node(f"threshold:{key}", "threshold", key, area="tuning", description=entry.get("note", ""),
               value=json.dumps(value)[:160], unit=entry.get("unit", ""), basis=entry.get("basis", ""),
               source=entry.get("source", ""))
        g.edge("file:data/thresholds.json", f"threshold:{key}", "defines")
        named = set(value) if isinstance(value, dict) else set()
        for v in (value.values() if isinstance(value, dict) else [value]):
            named |= set(v) if isinstance(v, list) else set()
        for t in sorted(named & set(maps)):
            g.edge(f"threshold:{key}", f"table:{t}", "bounds")
        if (fam := THRESHOLD_FAMILY.get(key.split("_")[0])):
            g.edge(f"threshold:{key}", f"family:{fam}", "bounds")
    for f in editable_order:
        g.edge("threshold:one_family_per_flash", f"family:{f}", "bounds")

    # Cards -> tables, families, thresholds, terms.
    groups: dict[str, list[str]] = {}
    for t in maps:
        groups.setdefault(table_group(t).lower(), []).append(t)
    for nid, n in list(g.nodes.items()):
        if n["kind"] != "card":
            continue
        raw = (ROOT / n["path"]).read_text(encoding="utf-8")
        front, body = raw.split("---")[1], "---".join(raw.split("---")[2:])
        fields = dict(m.groups() for m in re.finditer(r"^([a-z-]+):\s*(.*?)\s*$", front, re.M))
        text = " ".join([fields.get("title", ""), fields.get("applies-when", ""), body])
        low = text.lower()
        for group, tables in groups.items():
            if group in low:
                for t in tables:
                    g.edge(nid, f"table:{t}", "about")
        topic_words = tokens(fields.get("topics", "") + " " + fields.get("title", ""))
        for f, words in WORDS.items():
            if topic_words & words:
                g.edge(nid, f"family:{f}", "about")
        link_terms(g, nid, text, terms, prose=True)

    # Code -> tables and thresholds it names; ADRs -> glossary terms they use.
    table_ids = sorted(maps, key=len, reverse=True)
    for path, area in files.items():
        if Path(path).suffix not in CODE_EXT or area == "data":
            continue
        text = (ROOT / path).read_text(encoding="utf-8")
        for t in table_ids:
            if re.search(r"(?<![\w+])" + re.escape(t) + r"(?![\w+])", text):
                g.edge(f"file:{path}", f"table:{t}", "touches")
        for key in thresholds:
            if not key.startswith("_") and re.search(r"\b" + re.escape(key) + r"\b", text):
                g.edge(f"file:{path}", f"threshold:{key}", "uses")
        link_terms(g, f"file:{path}", text, terms, prose=False)
    for nid, n in list(g.nodes.items()):
        if n["kind"] == "adr" or (n["kind"] == "doc" and n["path"].startswith("docs/research/")):
            link_terms(g, nid, (ROOT / n["path"]).read_text(encoding="utf-8"), terms, prose=True)


def link_terms(g: Graph, nid: str, text: str, terms: dict[str, str], prose: bool) -> None:
    """Glossary glue. A multi-word term matches in any case; a one-word term (Drive, Map) only as capitalized prose."""
    for term in terms:
        multi = " " in term
        if not multi and not prose:
            continue
        pattern = r"(?<![\w-])" + re.escape(term) + r"(?![\w-])"
        if re.search(pattern, text, 0 if not multi else re.I):
            g.edge(nid, f"term:{term}", "uses-term")


def add_numbers(g: Graph, quantities: dict[str, list[str]]) -> list[str]:
    """Number glue and drift. Cards reuse canonical number names (fact-check.md), so one name is one quantity:
    two current cards printing it differently conflict. The overlay's `quantities` says which threshold a name is;
    a card printing another value than thresholds.json conflicts with it (ADR 0008 check 3)."""
    thresholds = json.loads((ROOT / "data" / "thresholds.json").read_text(encoding="utf-8"))
    errors = [f"overlay quantity {name}: unknown threshold {ref}" for name, refs in quantities.items()
              for ref in refs if threshold_value(thresholds, ref) is None]
    seen: dict[str, tuple[str, dict]] = {}
    for nid, n in sorted(g.nodes.items()):
        if n["kind"] != "card" or n.get("status") != "current":
            continue
        for num in card_numbers(ROOT / n["path"]):
            first = seen.setdefault(num["name"], (nid, num))
            if first[0] != nid and (first[1]["value"], first[1]["unit"]) != (num["value"], num["unit"]):
                g.edge(nid, first[0], "conflicts", number=num["name"],
                       note=f"{num['value']} {num['unit']} here, {first[1]['value']} {first[1]['unit']} there")
            for ref in quantities.get(num["name"], []):
                want = threshold_value(thresholds, ref)
                if want is None:
                    continue
                same = abs(float(want) - num["value"]) < 1e-9
                g.edge(nid, f"threshold:{ref.partition('.')[0]}", "uses" if same else "conflicts", number=num["name"],
                       note=f"{ref} = {want}" if same else f"card prints {num['value']} {num['unit']}, {ref} = {want}")
    return errors


def overlay_section(name: str):
    overlay = json.loads(OVERLAY_PATH.read_text(encoding="utf-8")) if OVERLAY_PATH.exists() else {}
    return overlay.get(name, {} if name in ("notes", "quantities") else [])


def add_registry(g: Graph) -> None:
    """Parts (mods) and the vendor claims behind them, with sources; the log channels the engine reads."""
    reg = engine_registry()
    for key, src in reg["sources"].items():
        g.node(f"source:{key}", "source", src["name"], area="research", url=src.get("url"), source_kind=src.get("kind"))
    for c in reg["channels"]:
        g.node(f"channel:{c['key']}", "channel", c["label"], area="tuning", required=c["key"] in reg["required"],
               description=f"Log channel `{c['key']}`" + (" (the engine needs it)" if c["key"] in reg["required"] else ""))
    for claim in reg["claims"]:
        g.node(f"claim:{claim['id']}", "claim", claim["claim"], area="research", verdict=claim["verdict"],
               confidence=claim["conf"], description=claim.get("note", ""))
        for s in claim.get("src", []):
            g.edge(f"claim:{claim['id']}", f"source:{s}", "sourced-from")
    cards = {nid: tokens(n.get("topics", "")) for nid, n in g.nodes.items() if n["kind"] == "card" and n.get("status") == "current"}
    for item in reg["items"]:
        mid = f"mod:{item['id']}"
        g.node(mid, "mod", item["title"], area="tuning", description=item.get("change", ""), gain=item.get("gain"),
               prove=item.get("prove"), effect=item["effect"], effort=item["effort"], risk=item["risk"],
               score=3 * item["effect"] - 2 * item["effort"] - 2 * item["risk"],
               not_for_this_car=bool(item.get("notForThisCar")), features=item.get("features"), steps=item.get("steps"))
        for t in item.get("tables", []):  # the part's own note says whether it changes a table or only checks it
            g.edge(mid, f"table:{t['id']}", "checks" if t["what"].lower().startswith("check") else "changes", note=t["what"])
        for s in item.get("sources", []):
            g.edge(mid, f"source:{s}", "sourced-from")
        title = tokens(item["title"])
        for cid, topics in cards.items():
            if topics & title - {"and", "pipe", "front", "file", "high"}:
                g.edge(mid, cid, "explained-by")


def add_playbook(g: Graph) -> list[str]:
    """knowledge/playbook.md: the shop round as stages (with `next`) and the car's traits (with `affects`)."""
    links = {"cards": ("card", "method"), "terms": ("term", "uses-term"), "families": ("family", "works-on"),
             "thresholds": ("threshold", "gated-by"), "code": ("file", "implemented-by"),
             "channels": ("channel", "reads-channel")}
    errors: list[str] = []
    pending: list[tuple] = []
    section, current, order = "", None, 0
    for line in PLAYBOOK.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            section = "trait" if "trait" in line.lower() else "stage"
        elif m := re.match(r"^### ([a-z-]+): (.+)$", line):
            order += 1
            current = f"{section}:{m.group(1)}"
            g.node(current, section, m.group(2), area="process", path=rel(PLAYBOOK), order=order)
        elif current and (m := re.match(r"^([a-z]+): (.+)$", line)):
            key, values = m.group(1), [v.strip() for v in m.group(2).split(",")]
            for v in values:
                if key in ("next", "affects"):
                    target, label = re.match(r"^([a-z-]+)\s*(?:\((.+)\))?$", v).groups()
                    pending.append((current, f"stage:{target}", "next" if key == "next" else "affects", label))
                elif key == "source":
                    path, _, sec = v.partition(" ")
                    pending.append((current, f"file:{path}", "sourced-from", sec or None))
                elif key in links:
                    kind, edge = links[key]
                    pending.append((current, f"{kind}:{v}", edge, None))
                else:
                    errors.append(f"playbook {current}: unknown key {key}")
        elif current and line.strip():
            g.nodes[current]["description"] = (g.nodes[current].get("description", "") + " " + line.strip()).strip()
    for src, dst, kind, label in pending:
        if dst not in g.nodes:
            errors.append(f"playbook {src}: unknown {dst}")
        else:
            g.edge(src, dst, kind, **({"label": label} if label else {}))
    return errors


def apply_overlay(g: Graph) -> list[str]:
    """Hand-curated nodes, edges and notes. Returns errors for anything that doesn't resolve."""
    overlay = {k: overlay_section(k) for k in ("nodes", "edges", "notes")}
    errors = []
    for n in overlay.get("nodes", []):
        g.node(n["id"], n.get("kind", "concept"), n.get("label", n["id"]), area=n.get("area"),
               description=n.get("description", ""), curated=True)
    for e in overlay.get("edges", []):
        missing = [x for x in (e["from"], e["to"]) if x not in g.nodes]
        if missing:
            errors.append(f"overlay edge {e['from']} -> {e['to']}: unknown {', '.join(missing)}")
            continue
        for key in [k for k in g.edges if k[:2] == (e["from"], e["to"])]:
            del g.edges[key]  # a curated link says what the generated one only guessed
        g.edges[(e["from"], e["to"], e["kind"])] = {**e, "curated": True}
    for nid, note in overlay.get("notes", {}).items():
        if nid in g.nodes:
            g.nodes[nid]["note"] = note
        else:
            errors.append(f"overlay note: unknown node {nid}")
    return errors


def build() -> tuple[dict, list[str]]:
    g = Graph()
    files = collect_files()
    add_areas(g)
    add_files(g, files)
    add_cards(g)
    terms = add_terms(g)
    routes = add_routes(g, files)
    add_code_edges(g, files, routes)
    add_text_edges(g, files, terms)
    add_tuning(g, files, terms)
    add_registry(g)
    errors = add_playbook(g)
    errors += apply_overlay(g)
    errors += add_numbers(g, overlay_section("quantities"))
    nodes = sorted(g.nodes.values(), key=lambda n: n["id"])
    edges = sorted(g.edges.values(), key=lambda e: (e["from"], e["to"], e["kind"]))
    count = lambda items, key: dict(sorted({k: sum(1 for i in items if i[key] == k) for k in {i[key] for i in items}}.items()))
    graph = {
        "meta": {"generator": "tools/knowledge-graph.py", "overlay": rel(OVERLAY_PATH),
                 "nodes": count(nodes, "kind"), "edges": count(edges, "kind")},
        "nodes": nodes,
        "edges": edges,
    }
    return graph, errors


# ---------------------------------------------------------------------------
# Simulation: the engine on the owner's real Drives (needs the server env: `cd server && uv run python ...`)
# ---------------------------------------------------------------------------

def drive_row(drive_id: str, card: dict) -> dict:
    step = card["nextStep"] or {}
    plan = card.get("flashPlan") or {}
    return {
        "id": drive_id, "verdict": card.get("verdict"), "kind": step.get("kind"), "key": step.get("key"),
        "title": step.get("title"), "body": step.get("body"), "also": (step.get("also") or {}).get("why"),
        "plan": plan.get("headline"), "tables": sorted({c["table"] for c in plan.get("cells") or []}),
        # Readable = the engine read it: a Too-short drive gets no Verdict, dead gauges send the logger step.
        "readable": card.get("verdict") is not None and step.get("key") != "logger",
        "open_steps": [{"key": o.get("key"), "title": o.get("title")} for o in card.get("openSteps") or []],
        "numbers": [f"{n['label']}: {n['value']}{n.get('unit') or ''}" for n in card.get("numbers") or []],
        "checkpoints": [f"{c['label']}: {c.get('value')} ({'met' if c.get('met') else 'not met'})"
                        for c in card.get("checkpoints") or []],
    }


def simulate() -> int:
    """Run the engine over the nine real Drives, plus the one path where it proposes cells (a boost overshoot
    over the hold, as test_flash_step does), and keep what it decided in drives.json."""
    import tempfile
    sys.path[:0] = [str(ROOT / "server"), str(ROOT / "server" / "tests" / "seam1")]
    from conftest import Loop  # noqa: E402  (the seam-1 harness: real app, real worker, temp SQLite)

    expect = {}
    if (OUT_DIR / "drives.json").exists():
        expect = {d["id"]: d.get("expect") for d in json.loads((OUT_DIR / "drives.json").read_text())["drives"]}
    drives = []
    with tempfile.TemporaryDirectory() as tmp:
        loop = Loop(Path(tmp)).start()
        try:
            drives += [drive_row(eid, reply.card) for eid, reply in loop.run(loop.reply_to_all_owner_drives())]
        finally:
            loop.close()
    with tempfile.TemporaryDirectory() as tmp:
        loop = Loop(Path(tmp)).start()
        try:
            card = loop.upload_and_reply("sep01-0813").card
            state = loop.store.car_state(None)
            for summary in state["drives"].values():
                summary["overshoot"] = 3.4
            loop.store.save_car_state(state)
            plan = loop.get("/api/state").json()["flashPlan"]
            row = drive_row("sep01-0813+overshoot", {**card, "flashPlan": plan, "verdict": card.get("verdict")})
            row["title"] = "Boost overshoot over the hold (fixture: overshoot set to 3.4 psi)"
            drives.append(row)
        finally:
            loop.close()
    for d in drives:
        if expect.get(d["id"]):
            d["expect"] = expect[d["id"]]
    (OUT_DIR / "drives.json").write_text(json.dumps({
        "_help": "Written by `make kg-simulate`: what the engine decided on each real Drive. `expect` is kept "
                 "across runs and is what the eval checks.", "drives": drives}, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote docs/knowledge-graph/drives.json: {len(drives)} drives")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def write_outputs(graph: dict) -> list[tuple[Path, str]]:
    """graph.json, and the situations the viewer draws as decision trees (both generated)."""
    import kg_reason as R
    situations = R.situations(R.Graph(graph))
    return [(GRAPH_PATH, json.dumps(graph, indent=1, ensure_ascii=False) + "\n"),
            (OUT_DIR / "situations.json", json.dumps({"situations": situations}, indent=1, ensure_ascii=False) + "\n")]


def serve() -> None:
    """The viewer, plus GET /ask?q=... so a typed question draws its own decision tree."""
    import functools
    import http.server
    import urllib.parse
    import kg_reason as R

    g = R.Graph.load()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            url = urllib.parse.urlparse(self.path)
            if url.path != "/ask":
                return super().do_GET()
            q = (urllib.parse.parse_qs(url.query).get("q") or [""])[0][:500]
            body = json.dumps(R.ask(g, q) | {"title": q, "group": "Asked", "expect": {}}).encode()
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(body)

    handler = functools.partial(Handler, directory=str(OUT_DIR))
    print("viewer: http://localhost:8765  (Ctrl-C stops)")
    http.server.ThreadingHTTPServer(("127.0.0.1", 8765), handler).serve_forever()


def main(argv: list[str]) -> int:
    sys.path.insert(0, str(Path(__file__).parent))
    if "--simulate" in argv:
        return simulate()
    import kg_reason as R

    graph, errors = build()
    for e in errors:
        print(f"error: {e}", file=sys.stderr)
    outputs = write_outputs(graph)
    if "--check" in argv:
        stale = [rel(path) for path, text in outputs if not path.exists() or path.read_text(encoding="utf-8") != text]
        for path in stale:
            print(f"{path} is stale: run `make kg`", file=sys.stderr)
        conflicts = R.checks(R.Graph(graph))["errors"]
        for c in conflicts:
            print(f"error: {c}", file=sys.stderr)
        return 1 if stale or errors or conflicts else 0
    if errors:
        return 1
    for path, text in outputs:
        path.write_text(text, encoding="utf-8")
    m = graph["meta"]
    print(f"wrote {rel(GRAPH_PATH)}: {sum(m['nodes'].values())} nodes, {sum(m['edges'].values())} edges; situations.json")
    if "--ask" in argv:
        q = argv[argv.index("--ask") + 1]
        print(R.explain(R.ask(R.Graph(graph), q)))
    if "--llm" in argv:
        result = R.llm_eval(R.Graph(graph))
        (OUT_DIR / "eval-llm-latest.json").write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")
        print(json.dumps({"model": result["model"], "n": result["n"], **result["arms"]}, indent=1))
        if "--record" in argv:
            R.record({"kind": "agent", "model": result["model"], **{f"{arm}_{k}": v for arm, m in result["arms"].items()
                                                                     for k, v in m.items()}}, argv[argv.index("--record") + 1])
        return 0
    if "--eval" in argv:
        return R.run_eval(R.Graph(graph), record=argv[argv.index("--record") + 1] if "--record" in argv else None)
    if "--serve" in argv:
        serve()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
