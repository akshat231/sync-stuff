#!/usr/bin/env bash
# Stops the CLIENT stack: syncthing-client only.
# Frontend (npm run dev) stops with Ctrl+C.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

docker compose -f "$ROOT_DIR/sync-client/docker-compose.yml" --env-file "$ROOT_DIR/sync-client/.env" down

echo "Syncthing-client stopped."