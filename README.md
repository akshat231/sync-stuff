# Sync Stuff

Google-OAuth file sync across machines, powered by [Syncthing](https://syncthing.net).

## How it works

- Each **client** runs its own Syncthing (`syncthing-client`) plus the React frontend (`npm run dev`).
- The **server** runs one Syncthing (`syncthing-server`) plus the Node/Express backend (Docker).
- The backend and the server Syncthing share `/var/syncthing`; every user gets a matching folder on both ends (`user-<email>`) with the same folder ID, so files pushed from the client land where the backend can read and stream them.
- The client container mounts **one controlled parent dir** as `/sync` (default: `sync-client/data`, overridable). The Connect page translates any folder under it from host path → `/sync/...` container path, so Syncthing can see it. No per-folder remounts.

## Folder map

| Path | What |
| ---- | ---- |
| `sync-backend/` | Node backend (Docker: `sync-backend`, port 5000, shared network `sync-net`) |
| `sync-frontend/` | React app (dev server on `:3000`) |
| `sync-server/` | Standalone compose for `syncthing-server` |
| `sync-client/` | Standalone compose for `syncthing-client` |
| `scripts/` | Boot/stop scripts for both sides |

## Server (woodserver)

```bash
sudo bash scripts/run-server.sh
```

- Creates `sync-net`, writes `sync-server/.env` + `sync-backend/.env` (fresh API keys), starts `syncthing-server`, lets it generate `config.xml`, patches the API key in, joins the backend network, and boots `sync-backend`.
- Backend must be rebuilt after code changes:
  ```bash
  sudo docker compose -f sync-backend/docker-compose.yml up -d --build
  ```

## Client

```bash
sudo bash scripts/run-client.sh            # clean boot
CLIENT_SYNC_ROOT_HOST=/home/you bash scripts/run-client.sh   # custom sync root (persisted)
sudo bash scripts/stop-client.sh           # shut down
```

- Boots `syncthing-client`, mounts the sync root as `/sync`, updates `sync-frontend/.env` (`VITE_SYNCTHING_API_KEY`, `VITE_SYNC_ROOT_HOST`), then starts the vite dev server.
- The root must be a dir the container's Syncthing (UID 1000) can read/write; inside the repo it gets auto-`chown`ed, outside it you'll get a warning instead.

## Connect flow (frontend)

1. Pick a folder in Connect — its name auto-fills the host path as `<sync root>/<name>` (edit if nested deeper).
2. Click **Connect**: the page validates the host path (`/set-folder` dev endpoint, must exist under the sync root), calls the backend to create the matching server folder and register your client device, then configures the client Syncthing: adds the server device (pinned to `tcp://<server-tailscale-ip>:22000`), creates the folder with the same ID at the translated `/sync/...` path.
3. Once the two Syncthing devices link up (watch server/client logs for `Connection rejected` / established), files sync and appear on the dashboard; PDFs open via the backend streaming endpoint (range requests supported).

## Key env vars

Server (`sync-backend/.env`): `GOOGLE_*`, `SYNCTHING_URL=http://syncthing-server:8384`, `SYNCTHING_API_KEY`.

Client (`sync-client/.env`): `SYNCTHING_API_KEY`, `CLIENT_SYNC_ROOT_HOST`.

Frontend (`sync-frontend/.env`): `VITE_API_URL` (backend base, e.g. Tailscale IP), `VITE_SYNCTHING_URL`, `VITE_SYNCTHING_API_KEY`, `VITE_SYNC_ROOT_HOST`, `VITE_SYNC_ROOT_CONTAINER=/sync`.

## Notes / gotchas we've hit

- If `VITE_API_URL` looks glued to another key, the frontend `.env` lost a trailing newline — separate them onto their own lines and restart vite.
- Server `mkdir ...: permission denied` on a user folder = the folder isn't shared/mounted the same on both containers, or isn't owned by UID 1000.
- `Connection rejected ... unknown device` on the server = the client must be added to the server Syncthing's device list (the backend now does this on Connect; older builds need the rebuild).
- All per-project `.env`, `config/`, and `data/` dirs are gitignored; `package-lock.json` is ignored, so Dockerfiles use `npm install`, not `npm ci`.
