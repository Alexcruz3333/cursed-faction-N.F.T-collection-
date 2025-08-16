# Cursed Faction Backend (MVP)

Monorepo for MMO backend services: API Gateway, Matchmaking, Session, Inventory.

## Quickstart

- Prereqs: Docker, Docker Compose
- Start stack:

```bash
docker compose up --build
```

- Services:
  - API Gateway: http://localhost:8080/healthz
  - Jaeger UI: http://localhost:16686
  - NATS monitoring: http://localhost:8222

## Environment

Services read from env vars provided by docker-compose. For local dev without Docker, copy `.env.example` to each service or set:

- `POSTGRES_URL`
- `REDIS_URL`
- `NATS_URL`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
