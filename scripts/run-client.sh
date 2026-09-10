#!/usr/bin/env bash
# Boots the full CLIENT stack from scratch: generates an API key, writes .env
# into sync-client/, mounts one controlled sync-root parent dir into the
# syncthing container as /sync, updates sync-frontend/.env, brings up
# syncthing-client, then starts the frontend dev server.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/sync-client"
FRONTEND_DIR="$ROOT_DIR/sync-frontend"

KEY="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
echo "Generated client API key: ${KEY}"

# ── controlled sync-root (host) ─────────────────────────────────────
# One parent dir is mounted into the container as /sync. The frontend lets
# the user pick any folder UNDER this root and translates the path for
# Syncthing (host /<root>/<rel>  ->  container /sync/<rel>). Prefer a
# previously persisted value (from sync-client/.env) over the default.
if [ -z "${CLIENT_SYNC_ROOT_HOST:-}" ] && [ -f "$CLIENT_DIR/.env" ] && grep -q '^CLIENT_SYNC_ROOT_HOST=' "$CLIENT_DIR/.env"; then
  CLIENT_SYNC_ROOT_HOST="$(sed -n 's|^CLIENT_SYNC_ROOT_HOST=||p' "$CLIENT_DIR/.env" | head -1)"
fi
if [ -z "${CLIENT_SYNC_ROOT_HOST:-}" ] && [ -f "$FRONTEND_DIR/.env" ] && grep -q '^VITE_SYNC_ROOT_HOST=' "$FRONTEND_DIR/.env"; then
  CLIENT_SYNC_ROOT_HOST="$(sed -n 's|^VITE_SYNC_ROOT_HOST=||p' "$FRONTEND_DIR/.env" | head -1)"
fi
SYNC_ROOT_HOST="${CLIENT_SYNC_ROOT_HOST:-$CLIENT_DIR/data}"
mkdir -p "$SYNC_ROOT_HOST"
case "$SYNC_ROOT_HOST" in
  "$ROOT_DIR"/*)
    chown -R 1000:1000 "$SYNC_ROOT_HOST";;
  *)
    OWNER="$(stat -c %u "$SYNC_ROOT_HOST" 2>/dev/null || echo '?')"
    if [ "$OWNER" != "1000" ]; then
      echo "NOTE: sync root $SYNC_ROOT_HOST is owned by UID $OWNER (not 1000)."
      echo "      If Syncthing cannot write to picked folders, chown it: sudo chown -R 1000:1000 $SYNC_ROOT_HOST"
    fi;;
esac

# ── sync-client/.env ──────────────────────────────────────────────────
cat > "$CLIENT_DIR/.env" <<EOF
SYNCTHING_GUI_PORT=8384
SYNCTHING_SYNC_TCP_PORT=22000
SYNCTHING_SYNC_UDP_PORT=22000
SYNCTHING_DISCOVERY_PORT=21027
SYNCTHING_API_KEY=${KEY}
SYNCHED_FOLDER_ROOT=/var/syncthing
CLIENT_SYNC_ROOT_HOST=${SYNC_ROOT_HOST}
EOF
echo "Wrote $CLIENT_DIR/.env (sync root: ${SYNC_ROOT_HOST})"

# ── frontend .env keys ────────────────────────────────────────────────
upsert_env() {
  local file="$1" key="$2" value="$3" esc
  esc="$(printf '%s' "$value" | sed 's/[&|]/\\&/g')"
  if [ -f "$file" ] && grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${esc}|" "$file"
  else
    # append on a fresh line even if the file doesn't end with a newline
    if [ -s "$file" ] && [ -n "$(tail -c1 "$file")" ]; then
      printf '\n' >> "$file"
    fi
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

FRONTEND_ENV="$FRONTEND_DIR/.env"
mkdir -p "$(dirname "$FRONTEND_ENV")"
upsert_env "$FRONTEND_ENV" "VITE_SYNCTHING_API_KEY" "$KEY"
upsert_env "$FRONTEND_ENV" "VITE_SYNC_ROOT_HOST" "$SYNC_ROOT_HOST"
upsert_env "$FRONTEND_ENV" "VITE_SYNC_ROOT_CONTAINER" "/sync"
echo "Updated $FRONTEND_ENV with client API key + sync-root mapping"

# ── fix ownership (script runs as root via sudo, syncthing runs as UID 1000)
CONFIG_DIR="$CLIENT_DIR/config"
mkdir -p "$CONFIG_DIR"
chown -R 1000:1000 "$CONFIG_DIR"

# ── bring up syncthing-client ─────────────────────────────────────────
docker compose -f "$CLIENT_DIR/docker-compose.yml" --env-file "$CLIENT_DIR/.env" up -d

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
  docker compose -f "$CLIENT_DIR/docker-compose.yml" --env-file "$CLIENT_DIR/.env" restart
  echo "Patched API key into config.xml and restarted Syncthing."
else
  echo "WARNING: config.xml not found — API key not patched."
fi

# ── install deps if needed, then start frontend ───────────────────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo ""
echo "Starting frontend dev server..."
(cd "$FRONTEND_DIR" && npm run dev)