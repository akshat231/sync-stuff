#!/usr/bin/env bash
# Stops the SERVER stack: server Syncthing + backend.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

docker compose -f "$ROOT_DIR/sync-backend/docker-compose.yml" down
docker compose -f "$ROOT_DIR/sync-server/docker-compose.yml" --env-file "$ROOT_DIR/sync-server/.env" down

echo "Server stack stopped."