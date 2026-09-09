#!/usr/bin/env bash
# Creates the full CLIENT stack from scratch: generates API key, writes
# .env into sync-client/, updates sync-frontend/.env, and brings up
# client Syncthing + frontend.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/sync-client"
FRONTEND_DIR="$ROOT_DIR/sync-frontend"
KEY="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"

echo "Generated client API key: ${KEY}"

# ── sync-client/.env ──────────────────────────────────────────────────
cat > "$CLIENT_DIR/.env" <<EOF
SYNCTHING_GUI_PORT=8384
SYNCTHING_SYNC_TCP_PORT=22000
SYNCTHING_SYNC_UDP_PORT=22000
SYNCTHING_DISCOVERY_PORT=21027
SYNCTHING_API_KEY=${KEY}
SYNCHED_FOLDER_ROOT=/var/syncthing
EOF
echo "Wrote $CLIENT_DIR/.env"

# ── frontend .env keys ────────────────────────────────────────────────
FRONTEND_ENV="$FRONTEND_DIR/.env"
if [ -f "$FRONTEND_ENV" ] && grep -q "^VITE_SYNCTHING_API_KEY=" "$FRONTEND_ENV"; then
  sed -i "s|^VITE_SYNCTHING_API_KEY=.*|VITE_SYNCTHING_API_KEY=${KEY}|" "$FRONTEND_ENV"
else
  printf 'VITE_SYNCTHING_API_KEY=%s\n' "$KEY" >> "$FRONTEND_ENV"
fi
echo "Updated $FRONTEND_ENV with client API key"

# ── bring up containers ───────────────────────────────────────────────
docker compose -f "$CLIENT_DIR/docker-compose.yml" --env-file "$CLIENT_DIR/.env" up -d

# Let Syncthing generate its own config.xml, then patch the API key in
CONFIG_DIR="$CLIENT_DIR/config"
echo -n "Waiting for Syncthing to generate config..."
for _ in $(seq 1 30); do
  [ -f "$CONFIG_DIR/config.xml" ] && break
  echo -n "."
  sleep 1
done
echo ""

if [ -f "$CONFIG_DIR/config.xml" ]; then
  sed -i "s|<apikey>.*</apikey>|<apikey>${KEY}</apikey>|" "$CONFIG_DIR/config.xml"
  docker compose -f "$CLIENT_DIR/docker-compose.yml" --env-file "$CLIENT_DIR/.env" restart
  echo "Patched API key into config.xml and restarted Syncthing."
else
  echo "WARNING: config.xml not found — API key not patched."
fi

docker compose -f "$FRONTEND_DIR/docker-compose.yml" up -d --build

echo "Client stack is running (Syncthing + frontend)."