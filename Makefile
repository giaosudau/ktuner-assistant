# The tuning loop (`.scratch/tuning-loop/`): one command brings up the
# backend and the chat together, so the two sides work on each other's ports.
#
#   make run   backend  -> http://127.0.0.1:8000   (FastAPI + the Node engine worker;
#                                            health check: GET /healthz -> "ok")
#              chat     -> http://localhost:3000    (Next.js; talks to the backend
#                                            through the NEXT_PUBLIC_*_URL defaults,
#                                            so no .env is needed)
#
# Ctrl-C stops both.

.PHONY: run
run:
	@trap 'kill 0 2>/dev/null' INT TERM; \
	(cd server && uv run uvicorn kta_server.app:app --port 8000) & \
	(cd web && npm run dev) & \
	wait
