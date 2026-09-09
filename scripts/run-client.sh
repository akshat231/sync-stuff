#!/usr/bin/env bash
# Creates the full CLIENT stack from scratch: generates API key, writes
# .env and config.xml into sync-client/, updates sync-frontend/.env,
# and brings up client Syncthing + frontend.
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

# ── sync-client/config/config.xml ─────────────────────────────────────
mkdir -p "$CLIENT_DIR/config"
cat > "$CLIENT_DIR/config/config.xml" <<EOF
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
echo "Wrote $CLIENT_DIR/config/config.xml"

# ── sync-frontend/.env (client API key) ───────────────────────────────
FRONTEND_ENV="$FRONTEND_DIR/.env"
if [ -f "$FRONTEND_ENV" ] && grep -q "^VITE_SYNCTHING_API_KEY=" "$FRONTEND_ENV"; then
  sed -i "s|^VITE_SYNCTHING_API_KEY=.*|VITE_SYNCTHING_API_KEY=${KEY}|" "$FRONTEND_ENV"
else
  printf 'VITE_SYNCTHING_API_KEY=%s\n' "$KEY" >> "$FRONTEND_ENV"
fi
echo "Updated $FRONTEND_ENV with client API key"

# ── bring up containers ───────────────────────────────────────────────
docker compose -f "$CLIENT_DIR/docker-compose.yml" --env-file "$CLIENT_DIR/.env" up -d
docker compose -f "$FRONTEND_DIR/docker-compose.yml" up -d --build

echo "Client stack is running (Syncthing + frontend)."