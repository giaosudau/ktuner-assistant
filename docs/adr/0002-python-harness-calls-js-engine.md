# The Python harness calls the JavaScript engine; the engine is not ported

The tuning loop gets a backend: Python with LangChain and LangGraph runs the agent, the LLM calls (any OpenAI-compatible endpoint, key held server-side), the knowledge base, the evals and SQLite storage. Every verdict, Car history rule and Flash plan stays in the existing JavaScript engine (`engine/`), which the harness runs as its tools through a Node worker (JSON in, JSON out). One source of truth for the tuning math, and its tests keep guarding it.

## Considered Options

- **Port the engine to Python**: one language, but about 300 KB of tested rules rewritten, and two copies drift while the browser app still uses the JavaScript one.
- **Keep everything in the browser** (the owner's key called the provider directly): no server, but a key can't be protected, owners on phones lose their data with the browser, and a LangGraph harness can't run there.

## Consequences

The LLM never calculates a verdict or a map cell; it can only read them through engine tools, so a wrong engine number is fixed once in `engine/` and every surface follows. Each engine call crosses a process boundary, so tools return compact summaries, never raw logs.
