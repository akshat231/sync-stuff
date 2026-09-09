# Sync Frontend

React frontend for the Syncthing backend. Built with Vite + React 19.

## Features

- Google OAuth login (validated against backend `/api/login`)
- Device connection via Syncthing device ID (`/api/sync/connect`)
- Synced file browser (`/api/data`)
- Media playback for video, audio, and images

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your Google OAuth credentials:

```bash
cp .env.example .env
```

Edit `.env` and set `VITE_GOOGLE_CLIENT_ID` to your Google OAuth client ID.

3. Start the backend (`sync-backend`) on port 5000, then run:

```bash
npm run dev
```

The app runs on `http://localhost:3000` and proxies `/api` requests to the backend at `http://localhost:5000`.

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Start Vite dev server with HMR       |
| `npm run build`| Build for production                 |
| `npm run lint` | Run oxlint                           |
| `npm run preview` | Preview the production build     |

## Project Structure

```
src/
├── api/                  # Backend API clients
│   ├── api.js            # Axios instance (injects jwt_token header)
│   ├── authService.js    # POST /api/login
│   ├── dataService.js    # GET /api/data, media blob fetch
│   └── syncService.js    # POST /api/sync/connect
├── components/
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx   # Auth state + localStorage persistence
├── pages/
│   ├── Login.jsx         # Google OAuth sign-in
│   ├── Connect.jsx       # Device ID connection
│   ├── Dashboard.jsx     # Synced file grid
│   └── Player.jsx        # Media player (video/audio/image)
└── App.jsx               # Routing + layout
```

## Routes

| Path              | Access  | Description              |
| ----------------- | ------- | ------------------------ |
| `/login`          | Public  | Google OAuth login       |
| `/dashboard`      | Private | View synced files        |
| `/connect`        | Private | Connect a Syncthing device |
| `/play/:filename` | Private | Stream a media file      |