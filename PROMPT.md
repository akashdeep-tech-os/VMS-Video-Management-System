# Build a VMS Live-Streaming Load Test Tool (100 ONVIF Cameras over WebRTC)

You are a senior full-stack engineer. Build a **lightweight load-testing tool**, NOT a full VMS. Its only purpose: verify the system can handle 100 ONVIF IP cameras streaming live over WebRTC via MediaMTX, simultaneously and stably.

## Context: existing codebase

Work inside the existing repo (`E:\Live Streaming`). It already contains:
- A FastAPI scaffold in `backend/` (app/core, app/api/routes, models, schemas, Alembic, SQLite, logging, `.env` config with `APP_*`, `MEDIAMTX_*`, `VITE_API_BASE_URL` vars, ports: API 8000, RTSP 8554, WebRTC 8889, MediaMTX API 9997, metrics 9998)
- MediaMTX v1.19.3 binary vendored in `mediamtx_v1.19.3_windows_amd64/`, `mediamtx.yml` with API/metrics enabled
- A Vite + React + Tailwind + React Router + Axios frontend in `frontend/` with `api/`, `pages/`, `App.jsx`
- PowerShell scripts in `scripts/` (start-all, start-mediamtx, start-backend, start-frontend)

**Reuse and extend these conventions** (path prefixes, env vars, logging, script style). Do not rebuild the scaffold. Verify what exists first; extend what's missing.

## Scope boundaries — hard rules

IN SCOPE: camera CRUD + ONVIF validation, MediaMTX path registration, WebRTC live view, dashboard with camera/stream counts, load-testing optimizations.

NEVER implement: face recognition, ANPR, recording, playback, PTZ, AI features, notifications, user roles/authentication, analytics, multi-tenancy, or any video relay through the backend.

## Stack

- Backend: FastAPI (async), SQLAlchemy (reuse existing setup), Pydantic schemas, Uvicorn. Use `onvif-zeep` for ONVIF, `httpx` for MediaMTX API calls, `psutil` for system stats.
- Frontend: React + Vite, Tailwind (dark theme), React Router, Axios.
- Streaming: MediaMTX only. **WebRTC only** — no HLS, no RTMP playback in the UI.
- Frontend WebRTC: use the official `whep-client` npm package (MediaMTX's WHEP client) to keep connections robust and code minimal.

## Architecture

```
backend/app/
  main.py                 # app factory, lifespan, CORS, include routers (keep /api/v1 prefix)
  core/                   # config, logging, database (existing)
  models/camera.py        # Camera model
  schemas/camera.py       # Create/Update/Read schemas
  services/onvif.py       # ONVIF validation + camera info + RTSP URL resolution
  services/mediamtx.py    # MediaMTX control API client (path add/remove/status)
  api/routes/cameras.py   # camera REST endpoints
  api/routes/dashboard.py # dashboard stats + system stats
frontend/src/
  api/                    # axios client + cameraApi, dashboardApi
  context/CameraContext.jsx   # camera list state, polling, mutations
  hooks/useWebRTC.js       # WHEP connection lifecycle + auto-reconnect
  components/             # reusable: CameraForm, CameraTable, StatusBadge, VideoTile, GridLayout, StatCard
  pages/                  # DashboardPage, CamerasPage, LiveViewPage
```

Keep code modular, typed where practical, with comments only where logic is non-obvious (e.g., reconnect backoff, ONVIF fallback).

## Feature 1 — Dashboard (`/`)

Cards showing: Total Cameras, Online Cameras, Offline Cameras, Live Streams (MediaMTX paths currently publishing), and optional CPU/Memory usage (via `GET /api/v1/dashboard/stats`, backend `psutil`). Poll every 10 s. Simple dark cards, no charts needed.

## Feature 2 — Camera Management (`/cameras`)

Table with: name, IP, ONVIF port, RTSP port, status badge (online/offline/checking), stream state. Actions: Add, Edit, Delete (with confirm), Enable/Disable toggle (disabled cameras are not registered with MediaMTX and not polled).

Camera fields: `name`, `ip_address`, `onvif_port` (default 80), `rtsp_port` (default 554), `username`, `password`.

**Add-camera flow (POST /api/v1/camera):**
1. Validate ONVIF reachability with supplied credentials (timeout ≤ 5 s). Failure → 422 with a clear error (invalid creds / unreachable / timeout).
2. Fetch device info via ONVIF: manufacturer, model, firmware, serial.
3. Get profiles via ONVIF Media service; extract the RTSP stream URL via `GetStreamUri` (prefer the **secondary/low-resolution profile** if one exists — this is essential for 100-camera load). If `GetStreamUri` fails, fall back to probing common RTSP paths for that device and mark the camera accordingly.
4. Save to DB.
5. Register the RTSP source with MediaMTX (path `cam_{id}`).
6. Return the camera record plus `webrtc_url`.

## Feature 3 — Live View (`/live`)

- Grid layouts: 1x1, 2x2, 3x3, 4x4, 5x5, and **custom** (user enters rows × columns, e.g. 10x10 for 100 cams).
- Each tile: video element fed by WHEP from MediaMTX, overlaid with camera name and a connection indicator: `connecting` (amber pulse), `live` (green), `offline` (red), `reconnecting` (amber).
- Never mount more tiles than needed; tiles mount when grid is applied, unmount cleanly on grid change/navigation.

## Backend API contract (all under `/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/camera` | Validate ONVIF, fetch info, save, register MediaMTX path. 422 with `{"detail": "..."}` on ONVIF failure |
| GET | `/camera` | List all cameras (query param `include_disabled=true` optional; default includes disabled) |
| GET | `/camera/{id}` | Single camera (404 if missing) |
| PUT | `/camera/{id}` | Update fields; if IP/credentials/ports changed, re-validate ONVIF and re-register the MediaMTX path |
| DELETE | `/camera/{id}` | Delete record and remove MediaMTX path `cam_{id}` |
| GET | `/camera/{id}/status` | `{ "camera_id": 1, "onvif_reachable": true, "stream_publishing": true, "state": "online" }` — checks ONVIF (cached ≤ 15 s) + MediaMTX path state |
| GET | `/dashboard/stats` | `{ "total": 100, "online": 92, "offline": 8, "live_streams": 92, "cpu": 12.5, "memory": 61.2 }` |

The backend must **never relay video** — it only manages cameras and returns `webrtc_url` (e.g. `http://localhost:8889/cam_1/whep`). The browser connects to MediaMTX directly.

## MediaMTX integration (`services/mediamtx.py`)

- Register path: `PUT http://localhost:9997/v3/config/paths/add/{name}` with body `{"source": "rtsp://user:pass@ip:rtsp_port/<stream>", "sourceOnDemand": true}`.
- Remove: `DELETE /v3/config/paths/delete/{name}`.
- Status: `GET /v3/paths/list` (path state: `ready`/`publishing`). MediaMTX path state is `publishing` when a stream is live.
- All calls via `httpx.AsyncClient`, timeouts, structured error logging.

## WebRTC client (`hooks/useWebRTC.js`)

- For each tile, `createClient(webrtc_url)` from `whep-client`; attach the returned stream to the `<video>` and call `video.play()` muted + `playsInline`.
- **Auto-reconnect** (critical for load testing):
  - WHEP 404/400 (path missing) or stream end → treat as offline, retry with exponential backoff: 2 s → 4 s → 8 s → … capped at 30 s, with jitter.
  - On `connectionState === 'failed'` or ICE disconnection → close the PeerConnection (`pc.close()`, revoke `srcObject`), restart WHEP.
  - Pause reconnects while the tab is hidden (`visibilitychange`); resume on visible. This saves bandwidth so tests can run many tabs.
  - Expose state (`connecting/live/offline/reconnecting`) to the tile UI.
- Never leak connections: clean up on unmount, grid change, or camera disable.

## Load-testing optimizations (make these explicit, they're the point of the tool)

- Low-latency: default WHEP; prefer low-res camera profiles at add time.
- Memory: reuse one `RTCPeerConnection` per tile; do not create extra video elements; free object URLs on unmount.
- Efficient polling: status checks cached server-side (≤ 15 s TTL); the dashboard and camera list share one poll cadence (10 s) — no per-camera timers on the client.
- Backend: ONVIF/network calls run via `asyncio.to_thread` so the API never blocks; timeouts everywhere; concurrent onvif checks limited to ~20 at a time.
- SQLite is fine. Optimize queries (no N+1 on list pages).
- Everything must keep working with 100 cameras + several browser tabs open.

## Error handling & logging

- FastAPI: standard error responses; ONVIF failures → 422 with actionable messages; not-found → 404; MediaMTX registration failures must not block camera save (save camera, log failure, return camera with `stream_state: "error"`).
- Log to the existing rotating logger: camera add/update/delete, ONVIF failures, MediaMTX API errors, reconnect storms.
- Frontend: axios interceptor surfaces errors as small toast/inline messages; no silent failures; loading states on every async action.

## UI

- Clean dark theme only (Tailwind dark slate palette, e.g. `slate-900` background, `slate-800` cards, accent color for status). Simple, functional, dense — no decorative design.
- Layout: sidebar (Dashboard, Cameras, Live View) + top bar. All pages responsive enough for a 1080p monitor.

## Definition of done — verify before finishing

1. `GET /api/v1/health` still works; `mediamtx` check reports ok.
2. `POST /api/v1/camera` with a fake unreachable IP returns 422 quickly (< 6 s); with a real ONVIF camera it validates, saves, registers `cam_{id}` in MediaMTX, and returns a working `webrtc_url`.
3. Opening that `webrtc_url` in a browser tile shows video; killing the camera stream flips the tile to offline and it auto-reconnects when the stream returns.
4. Grid 5x5 and 10x10 both render correctly with 100 cameras; navigation away/back leaks no connections (verify with browser DevTools: no orphaned PeerConnections).
5. DELETE removes both DB row and MediaMTX path.
6. Run `scripts/start-all.ps1` end-to-end and confirm all three services boot with no errors.
7. Frontend builds without errors (`npm run build`) and backend starts cleanly (no import errors, no warnings).

## Report back

Summarize: what was built, the file tree, how to run it, how to add test cameras (real ONVIF or fake RTSP sources via `ffmpeg -re -f lavfi -i testsrc2 -f rtsp rtsp://localhost:8554/cam_1` style test streams), and any deviations from this prompt.
