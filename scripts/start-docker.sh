#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building and starting docker-compose stack..."
docker compose -f docker/docker-compose.yml up --build -d

echo "Relay logs (follow):"
docker compose -f docker/docker-compose.yml logs -f relay
