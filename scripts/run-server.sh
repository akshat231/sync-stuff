#!/usr/bin/env bash
# Creates the full SERVER stack from scratch: generates API key, writes
# .env into sync-server/, updates sync-backend/.env, creates the shared
# network, and brings up server Syncthing + backend.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$ROOT_DIR/sync-server"
BACKEND_DIR="$ROOT_DIR/sync-backend"
KEY="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"

echo "Generated server API key: ${KEY}"

# ── sync-server/.env ──────────────────────────────────────────────────
cat > "$SERVER_DIR/.env" <<EOF
SYNCTHING_GUI_PORT=8384
SYNCTHING_SYNC_TCP_PORT=22000
SYNCTHING_SYNC_UDP_PORT=22000
SYNCTHING_DISCOVERY_PORT=21027
SYNCTHING_API_KEY=${KEY}
SYNCHED_FOLDER_ROOT=/var/syncthing
EOF
echo "Wrote $SERVER_DIR/.env"

# ── backend .env keys ─────────────────────────────────────────────────
BACKEND_ENV="$BACKEND_DIR/.env"
if [ -f "$BACKEND_ENV" ] && grep -q "^SYNCTHING_API_KEY=" "$BACKEND_ENV"; then
  sed -i "s|^SYNCTHING_API_KEY=.*|SYNCTHING_API_KEY=${KEY}|" "$BACKEND_ENV"
else
  printf 'SYNCTHING_API_KEY=%s\n' "$KEY" >> "$BACKEND_ENV"
fi
echo "Updated $BACKEND_ENV with server API key"

# ── shared network for backend ────────────────────────────────────────
docker network inspect sync-net >/dev/null 2>&1 || docker network create sync-net

# ── fix ownership (script runs as root via sudo, syncthing runs as UID 1000)
CONFIG_DIR="$SERVER_DIR/config"
mkdir -p "$CONFIG_DIR"
chown -R 1000:1000 "$CONFIG_DIR"

# ── bring up containers ───────────────────────────────────────────────
docker compose -f "$SERVER_DIR/docker-compose.yml" --env-file "$SERVER_DIR/.env" up -d

# Put syncthing-server on the shared network so the backend can reach it
docker network connect sync-net syncthing-server 2>/dev/null || true

# Let Syncthing generate its own config.xml, then patch the API key in
echo -n "Waiting for Syncthing to generate config..."
for _ in $(seq 1 30); do
  [ -f "$CONFIG_DIR/config.xml" ] && break
  echo -n "."
  sleep 1
done
echo ""

if [ -f "$CONFIG_DIR/config.xml" ]; then
  sed -i "s|<apikey>.*</apikey>|<apikey>${KEY}</apikey>|" "$CONFIG_DIR/config.xml"
  chown -R 1000:1000 "$CONFIG_DIR"
  docker compose -f "$SERVER_DIR/docker-compose.yml" --env-file "$SERVER_DIR/.env" restart
  echo "Patched API key into config.xml and restarted Syncthing."
else
  echo "WARNING: config.xml not found — API key not patched."
fi

docker compose -f "$BACKEND_DIR/docker-compose.yml" up -d --build

echo "Server stack is running (Syncthing + backend)."