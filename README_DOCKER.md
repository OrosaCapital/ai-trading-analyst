Local Docker & Compose for ai-trading-analyst

This adds a minimal Docker setup to run the relay alongside Redis and Prometheus for local prod-like testing.

Files added
- `docker/relay/Dockerfile` — image to run the relay (`ai-trading-analyst/server/relay.js`).
- `docker/docker-compose.yml` — `redis`, `prometheus`, and `relay` services.

Quick start (from repository root):

```bash
# build & start services
docker compose -f docker/docker-compose.yml up --build -d

# show logs for relay
docker compose -f docker/docker-compose.yml logs -f relay

# stop
docker compose -f docker/docker-compose.yml down
```

Notes
- The relay will use `REDIS_URL=redis://redis:6379` in docker-compose.
- Prometheus config is mounted from `prometheus/prometheus.yml`.
- The Dockerfile runs `npm ci` inside `ai-trading-analyst/` — ensure `package-lock.json` or `pnpm` lockfiles are present for repeatable builds.

Next steps
- I can push the cleaned `relay-metrics-ci` branch to a remote you provide, or add CI publishing steps for Docker images.
