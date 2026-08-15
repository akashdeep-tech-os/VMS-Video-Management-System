# Live Streaming Platform

Development environment for a live streaming platform — **load testing 100 ONVIF
IP cameras streaming live over WebRTC via MediaMTX**.

This is a lightweight load-testing tool, **not** a full VMS. No recording,
playback, PTZ, face recognition, ANPR, AI features, notifications or user
roles. The backend only manages cameras; it never relays video. Browsers
connect to MediaMTX directly over WebRTC (WHEP).

## Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Backend   | FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn        |
| Frontend  | React + Vite, Tailwind CSS, React Router, Axios        |
| Streaming | MediaMTX (RTSP in → WebRTC/WHEP out), `whip-whep` client |
| ONVIF     | `onvif-zeep`                                           |

## Project structure

```
├── .env.example              # Template for environment variables
├── .env                      # Local environment configuration (gitignored)
├── mediamtx.yml              # MediaMTX configuration (API, metrics enabled)
├── PROMPT.md                 # Build prompt / spec for this project
├── scripts/
│   ├── start-all.ps1         # Launch MediaMTX, backend and frontend
│   ├── start-mediamtx.ps1    # Launch MediaMTX only
│   ├── start-backend.ps1     # Launch FastAPI (creates venv on first run)
│   └── start-frontend.ps1    # Launch Vite dev server (installs deps on first run)
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, lifespan
│   │   ├── core/             # config, logging, database
│   │   ├── api/routes/       # health, cameras, dashboard
│   │   ├── models/camera.py  # Camera SQLAlchemy model
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # onvif, mediamtx, status services
│   ├── alembic/              # Database migrations
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client and API modules
│   │   ├── context/          # CameraContext (list + status polling)
│   │   ├── hooks/            # useWebRTC (WHEP + auto-reconnect)
│   │   ├── components/       # StatCard, CameraTable, CameraForm, VideoTile, ...
│   │   ├── pages/            # Dashboard, Cameras, Live View, Health
│   │   ├── App.jsx           # Router and sidebar layout
│   │   └── main.jsx
│   ├── scripts/              # whep-smoke-test.mjs (WHEP endpoint smoke test)
│   ├── vite.config.js        # React + Tailwind plugins, envDir: ../
│   └── package.json
└── mediamtx_v1.19.3_windows_amd64/   # MediaMTX binaries (vendored)
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- MediaMTX binary (already vendored in `mediamtx_v1.19.3_windows_amd64/`)

## Quick start

```powershell
# One command: starts MediaMTX, backend and frontend in separate windows
.\scripts\start-all.ps1

# Or individually
.\scripts\start-mediamtx.ps1
.\scripts\start-backend.ps1
.\scripts\start-frontend.ps1
```

First runs create `backend/.venv` and install backend requirements, and run
`npm install` for the frontend.

Stop services with Ctrl+C in each window. If ports are already in use, stop
the existing process first (e.g. an old MediaMTX instance started with the
default config).

## Pages

| Page          | URL           | Purpose                                                      |
| ------------- | ------------- | ------------------------------------------------------------ |
| Dashboard     | `/`           | Total / online / offline / disabled cameras, live streams, CPU & memory |
| Cameras       | `/cameras`    | Add / edit / delete / enable / disable ONVIF cameras         |
| Live View     | `/live`       | WebRTC grid: 1x1 – 5x5 presets and custom layouts (e.g. 10x10) |
| Health        | `/health`     | Backend / database / MediaMTX health                         |

## Camera management

Adding a camera runs a probe (≤ ~15 s):

1. TCP check on the ONVIF port → fast 422 for unreachable IPs.
2. ONVIF `GetDeviceInformation` + `GetProfiles` → device info.
3. `GetStreamUri` for the **lowest-resolution profile** (secondary stream) to
   keep bandwidth low at 100 cameras.
4. If `GetStreamUri` fails, well-known vendor RTSP paths are probed and the
   camera is marked `rtsp_source: "fallback"`.
5. The camera is saved and registered with MediaMTX as path `cam_{id}` with
   `sourceOnDemand: true` — MediaMTX only pulls the camera while someone is
   watching it.

Edit re-validates ONVIF only when connection fields (IP, ports, credentials)
change. An empty password keeps the stored one. Disabling a camera removes
its MediaMTX path and excludes it from status checks.

## Backend API (`/api/v1`)

| Method | Path                     | Purpose                                                        |
| ------ | ------------------------ | -------------------------------------------------------------- |
| POST   | `/camera`                | Validate ONVIF, fetch info, save, register MediaMTX path (422 on probe failure) |
| GET    | `/camera`                | List all cameras                                               |
| GET    | `/camera/statuses`       | Bulk status (reachability + publishing) with server-side 15 s cache |
| GET    | `/camera/{id}`           | Single camera (404 if missing)                                 |
| GET    | `/camera/{id}/status`    | Single camera status                                           |
| PUT    | `/camera/{id}`           | Update; re-validates + re-registers when connection fields change |
| DELETE | `/camera/{id}`           | Delete record and remove the MediaMTX path (204)               |
| GET    | `/dashboard/stats`       | `{total, enabled, online, offline, disabled, live_streams, cpu, memory}` |
| GET    | `/health`                | Component health checks                                        |

Responses include `webrtc_url`, e.g. `http://localhost:8889/cam_1/whep` — the
browser connects to MediaMTX directly; the backend never relays video.

## Load testing with fake cameras

Without real hardware, simulate cameras with ffmpeg publishing to MediaMTX.

The easiest way is the helper script (starts `N` cameras at 25 fps with
real-time encoder settings and stops them all on Ctrl+C):

```powershell
.\scripts\start-fake-cameras.ps1            # 4 cameras at 25 fps
.\scripts\start-fake-cameras.ps1 -Count 16  # 16 cameras
.\scripts\start-fake-cameras.ps1 -Fps 30    # smoother motion
```

Each simulated camera publishes to `simcam_N`; watch any stream directly at
`http://localhost:8889/simcam_N/whep`. For a single manual stream with
low-latency encoder flags (1 s keyframe interval so viewers join quickly):

```powershell
ffmpeg -re -f lavfi -i testsrc2=size=640x360:rate=25 -an `
  -c:v libx264 -preset ultrafast -tune zerolatency -g 25 -b:v 800k -maxrate 800k -bufsize 400k `
  -f flv rtmp://localhost:1935/cam_1
```

Then open `http://localhost:5173/live`, pick the grid size and watch the tiles
connect over WebRTC. To simulate many cameras, launch several ffmpeg processes
with different paths (e.g. `cam_1` … `cam_100`) and use the custom grid. Note:
`cam_{id}` paths must match the camera IDs returned by the API for the WHEP
URLs to line up; alternatively add real cameras whose `webrtc_url` points at
the published paths.

The frontend contains a WHEP smoke test that exercises the full
offer/answer/cleanup cycle against MediaMTX (pass a path to test a specific
stream):

```powershell
node frontend\scripts\whep-smoke-test.mjs
node frontend\scripts\whep-smoke-test.mjs simcam_1
```

## Environment (.env)

Copy `.env.example` to `.env` if it does not exist and adjust values.

| Variable             | Default                  | Description                          |
| -------------------- | ------------------------ | ------------------------------------ |
| `APP_NAME`           | Live Streaming           | Application name                     |
| `APP_ENV`            | development              | Environment name                     |
| `APP_VERSION`        | 0.1.0                    | Application version                  |
| `API_HOST` / `API_PORT` | 127.0.0.1 / 8000      | Backend bind address and port        |
| `LOG_LEVEL`          | INFO                     | Logging level                        |
| `LOG_DIR`            | ./logs                   | Log file directory (rotates at 5 MB) |
| `DATABASE_URL`       | sqlite:///./streaming.db | SQLAlchemy database URL              |
| `CORS_ORIGINS`       | http://localhost:5173    | Comma-separated allowed origins      |
| `VITE_API_BASE_URL`  | http://localhost:8000    | Frontend API base URL (Vite)         |
| `MEDIAMTX_API_URL`   | http://localhost:9997    | MediaMTX control API                 |
| `MEDIAMTX_RTSP_URL`  | rtsp://localhost:8554    | RTSP endpoint                        |
| `MEDIAMTX_RTMP_URL`  | rtmp://localhost:1935    | RTMP endpoint                        |
| `MEDIAMTX_HLS_URL`   | http://localhost:8888    | HLS endpoint                         |
| `MEDIAMTX_WEBRTC_URL`| http://localhost:8889    | WebRTC endpoint                      |

Backend relative paths (`LOG_DIR`, `DATABASE_URL`) resolve against the
`backend/` directory, since Uvicorn and Alembic run from there.

## Database migrations

```powershell
cd backend
.venv\Scripts\python.exe -m alembic revision --autogenerate -m "description"
.venv\Scripts\python.exe -m alembic upgrade head
```

## Logging

The backend logs to console and to `backend/logs/app.log` (rotating file
handler, 5 MB per file, 5 backups). Level and directory come from `LOG_LEVEL`
and `LOG_DIR`. Uvicorn access/error logs are routed through the same setup.

## Ports

| Service          | URL                                  |
| ---------------- | ------------------------------------ |
| Frontend (Vite)  | http://localhost:5173                |
| Backend API      | http://localhost:8000                |
| API docs (Swagger)| http://localhost:8000/docs          |
| RTSP             | rtsp://localhost:8554                |
| RTMP             | rtmp://localhost:1935                |
| HLS              | http://localhost:8888                |
| WebRTC           | http://localhost:8889                |
| MediaMTX API     | http://localhost:9997                |
| MediaMTX metrics | http://localhost:9998                |

## Publishing a test stream

With OBS or ffmpeg, publish to:

```
rtmp://localhost:1935/live/test
```

then watch via HLS at `http://localhost:8888/live/test`, or play the RTSP URL
`rtsp://localhost:8554/live/test` with VLC or mpv.
