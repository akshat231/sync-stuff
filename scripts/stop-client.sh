#!/usr/bin/env bash
# Stops the CLIENT stack: client Syncthing + frontend.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

docker compose -f "$ROOT_DIR/sync-frontend/docker-compose.yml" down
docker compose -f "$ROOT_DIR/sync-client/docker-compose.yml" --env-file "$ROOT_DIR/sync-client/.env" down

echo "Client stack stopped."