# One container, one URL: FastAPI serves the static chat and the API on one origin.
FROM node:24-slim AS web
WORKDIR /repo/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# Same-origin: every call is relative, so there is no CORS and no host baked in.
ENV NEXT_PUBLIC_SERVER_URL="" NEXT_PUBLIC_AGENT_URL=/agent
RUN npm run build

# The worker needs Node, so Node is the base and uv brings Python 3.13.
FROM node:24-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.3 /uv /usr/local/bin/uv
ENV UV_PYTHON=3.13 UV_PYTHON_INSTALL_DIR=/opt/python UV_LINK_MODE=copy
COPY server/pyproject.toml server/uv.lock /repo/server/
WORKDIR /repo/server
RUN uv sync --frozen --no-dev
COPY engine /repo/engine
COPY data /repo/data
COPY knowledge /repo/knowledge
# Cards fail to load unless the research doc each one cites exists.
COPY docs/research /repo/docs/research
COPY server/kta_server /repo/server/kta_server
COPY server/kta_worker /repo/server/kta_worker
COPY --from=web /repo/web/out /repo/web/out

# shortcut: runs as root because Railway volumes break non-root images (set RAILWAY_RUN_UID=0 or run as root), move to a non-root user with a chown entrypoint when more than the beta runs here
ENV KTA_DB=/data/ktuner.db KTA_WEB_DIR=/repo/web/out
EXPOSE 8000
# --no-access-log: the access log would write every /join/<secret> to the logs.
CMD ["sh", "-c", "exec .venv/bin/uvicorn kta_server.owners:app --no-access-log --host 0.0.0.0 --port ${PORT:-8000}"]
