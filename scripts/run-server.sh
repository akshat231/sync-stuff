#!/usr/bin/env bash
# Creates the full SERVER stack from scratch: generates API key, writes
# .env and config.xml into sync-server/, updates sync-backend/.env,
# creates the shared network, and brings up server Syncthing + backend.
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

# ── sync-server/config/config.xml ─────────────────────────────────────
mkdir -p "$SERVER_DIR/config"
cat > "$SERVER_DIR/config/config.xml" <<EOF
<configuration version="28">
    <folder id="default" label="Default" path="/var/syncthing" type="sendreceive" rescanIntervalS="3600" fsWatcherEnabled="true" fsWatcherDelayS="10" ignorePerms="false" autoNormalize="true">
    </folder>
    <gui enabled="true" tls="false" debugging="false">
        <address>0.0.0.0:8384</address>
        <apikey>${KEY}</apikey>
        <theme>default</theme>
    </gui>
    <options>
        <listenAddress>default</listenAddress>
        <globalAnnounceEnabled>false</globalAnnounceEnabled>
        <natEnabled>false</natEnabled>
    </options>
</configuration>
EOF
echo "Wrote $SERVER_DIR/config/config.xml"

# ── sync-backend/.env (server API key) ────────────────────────────────
BACKEND_ENV="$BACKEND_DIR/.env"
if [ -f "$BACKEND_ENV" ] && grep -q "^SYNCTHING_API_KEY=" "$BACKEND_ENV"; then
  sed -i "s|^SYNCTHING_API_KEY=.*|SYNCTHING_API_KEY=${KEY}|" "$BACKEND_ENV"
else
  printf 'SYNCTHING_API_KEY=%s\n' "$KEY" >> "$BACKEND_ENV"
fi
echo "Updated $BACKEND_ENV with server API key"

# ── shared network for backend ────────────────────────────────────────
docker network inspect sync-net >/dev/null 2>&1 || docker network create sync-net

# ── bring up containers ───────────────────────────────────────────────
docker compose -f "$SERVER_DIR/docker-compose.yml" --env-file "$SERVER_DIR/.env" up -d
docker compose -f "$BACKEND_DIR/docker-compose.yml" up -d --build

echo "Server stack is running (Syncthing + backend)."