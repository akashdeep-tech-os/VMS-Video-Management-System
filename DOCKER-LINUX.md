# Surakshit VMS — Full Docker Setup on Linux

This guide takes you from a fresh Linux machine (Ubuntu 22.04/24.04/Debian) to a fully running VMS stack in Docker — frontend, backend, and MediaMTX streaming server — as three isolated containers.

---

## 1. Architecture

```
                         ┌──────────────────────────────────────────────┐
                         │            Docker network: vms               │
                         │                                              │
 Browser ── :80 ────────►│  frontend (nginx:alpine)                     │
 (SPA + /api proxy)      │    ├─ serves built React bundle              │
                         │    └─ /api/*  ──────────────┐                │
                         │                              ▼                │
                         │                         backend (edge-server)│
                         │    FastAPI + SQLite + ffmpeg                 │
                         │    ├─ REST API :8080 ◄───────────────────────┤
                         │    └─ MediaMTX control API ─────────────┐    │
                         │                                         ▼    │
                         │                              mediamtx          │
                         │    RTSP in ──► WebRTC/WHEP out               │
                         └──────────────────────────────────────────────┘
                                   ▲                ▲
                       :8554/:1935/:8889/:9997   cameras (ONVIF/RTSP)
                       (published to host)      (must be reachable)
```

| Container | Image base | Role | Host ports |
|---|---|---|---|
| `surakshit-vms-frontend` | `nginx:alpine` (after Node build) | Serves the React SPA, reverse-proxies `/api` → backend | **80** |
| `edge-server` | `python:3.12-slim` + ffmpeg | FastAPI backend, SQLite DB, Alembic migrations | **8080** (docs/debug) |
| `surakshit-vms-mediamtx` | `bluenviron/mediamtx:1.19.3` | RTSP→WebRTC gateway | **8554, 1935, 8889/tcp+udp, 8189/udp, 9997, 9998, 8002-8003/udp** |

**Key design points**

- The browser only talks to **port 80** (nginx). nginx forwards `/api/*` and `/ws/*` to the backend container internally at `edge-server:8080` — no CORS setup needed.
- The backend never relays video. It only registers camera RTSP paths with MediaMTX via its control API (`:9997`). Browsers pull live video directly from MediaMTX via WebRTC/WHEP (`:8889`).
- All images are **linux/amd64**. They run on any Intel/AMD Linux host.

---

## 2. Project files involved

```
VMS-Video-Management-System/
├── docker-compose.yml          # orchestrates all 3 containers  ← created
├── .env                        # secrets & host-specific config (gitignored)
├── mediamtx.yml                # MediaMTX config (mounted into container)
├── backend/
│   ├── Dockerfile              # python:3.12-slim + ffmpeg        ← created
│   ├── .dockerignore           # excludes .venv, *.db, logs       ← created
│   ├── requirements.txt
│   └── app/ ...                # FastAPI source
└── frontend/
    ├── Dockerfile              # multi-stage: node build → nginx  (existing)
    ├── .dockerignore
    ├── nginx.conf              # SPA + /api reverse proxy
    └── src/ ...                # React source
```

> **Do not edit `frontend/Dockerfile` or `nginx.conf`** — they already proxy `/api` to `edge-server:8080`. The backend container name in compose **must** stay `edge-server`.

---

## 3. One-time host setup

### 3.1 Install Docker Engine + Compose

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# IMPORTANT: log out and back in (or reboot) for the group to apply
```

Verify:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

> On ARM hosts (Raspberry Pi, Graviton) the prebuilt amd64 images won't run — build natively on the device instead (same commands below).

### 3.2 (Optional) Pre-create the data volume

Compose creates it automatically, but you can pre-create and seed it:

```bash
docker volume create surakshit-vms_backend-data
```

---

## 4. Get the code

```bash
git clone https://github.com/akashdeep-tech-os/VMS-Video-Management-System.git
cd VMS-Video-Management-System
git checkout Development
```

---

## 5. Configure

Create your local `.env` (never committed — `.env` is in `.gitignore`):

```bash
cp .env.example .env 2>/dev/null || nano .env   # create it manually if no example
```

`.env` contents — adjust to your environment:

```ini
# Host port for the frontend
FRONTEND_PORT=80

# Host port for direct backend access (Swagger at /docs)
BACKEND_PORT=8080

# --- Security (CHANGE THESE) ---
AUTH_SECRET_KEY=put-a-long-random-string-here
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=ChangeMe123!

APP_ENV=production

# Browser-facing MediaMTX WebRTC URL.
# Local testing on the server itself:  http://localhost:8889
# Access from other PCs/phones:        http://<SERVER_IP>:8889
MEDIAMTX_WEBRTC_URL=http://localhost:8889
MEDIAMTX_HLS_URL=http://localhost:8888

# Allowed CORS origins (comma separated)
CORS_ORIGINS=http://localhost,http://127.0.0.1
```

### Which values matter most

| Variable | Why it matters |
|---|---|
| `AUTH_SECRET_KEY` | Signs login JWTs. If changed later, all users must log in again. |
| `BOOTSTRAP_ADMIN_PASSWORD` | First-run admin password. Only applied when the users table is empty. |
| `MEDIAMTX_WEBRTC_URL` | This exact URL is handed to the browser for live video. If other PCs will watch streams, it **must** be the server's LAN IP — `localhost` would point at the viewer's own machine and fail. |

---

## 6. Build and start

```bash
docker compose up -d --build
```

First run takes **3–5 minutes** (downloads base images, installs ffmpeg + pip packages, builds the React bundle). Subsequent starts are instant.

Watch the backend come up (migrations run automatically here):

```bash
docker compose logs -f backend
```

You should see:

```
INFO  [alembic.runtime.migration] Running upgrade ... -> b7e8f9a0c1d2, add users table ...
INFO  [app.core.bootstrap] Seeded bootstrap administrator 'admin'
INFO  [uvicorn.error] Uvicorn running on http://0.0.0.0:8080
```

Confirm all three containers are `Up`:

```bash
docker compose ps
```

Expected output:

```
NAME                          STATUS         PORTS
edge-server                   Up ...         0.0.0.0:8080->8080/tcp
surakshit-vms-frontend        Up ...         0.0.0.0:80->80/tcp
surakshit-vms-mediamtx        Up ...         0.0.0.0:8554->8554/tcp, ...8889->8889/tcp+udp...
```

---

## 7. Open the VMS

| From | URL |
|---|---|
| On the server itself | `http://localhost` |
| From any PC/phone on the LAN | `http://<SERVER_IP>` |
| Backend Swagger docs | `http://<SERVER_IP>:8080/docs` |
| MediaMTX metrics | `http://<SERVER_IP>:9998` |

Login: **admin / admin123** (or whatever you set in `.env`) — change the password immediately in the UI.

---

## 8. Firewall

```bash
sudo ufw allow 80/tcp        # web UI
sudo ufw allow 8080/tcp      # API docs (optional — can remove after setup)
sudo ufw allow 8554/tcp      # RTSP
sudo ufw allow 1935/tcp      # RTMP
sudo ufw allow 8889/tcp      # WebRTC signaling (WHEP)
sudo ufw allow 8889/udp      # WebRTC media
sudo ufw allow 8189/udp      # WebRTC local UDP
sudo ufw allow 9997/tcp      # MediaMTX control API
sudo ufw allow 9998/tcp      # metrics
sudo ufw enable
```

Restrict 8080/9997/9998 to your LAN if the server is exposed:
```bash
sudo ufw allow from 192.168.0.0/24 to any port 8080 proto tcp
```

---

## 9. Everyday commands

```bash
cd VMS-Video-Management-System

docker compose ps                    # status
docker compose logs -f backend       # backend logs
docker compose logs -f frontend      # nginx logs
docker compose logs -f mediamtx      # streaming logs

docker compose restart backend       # restart one service
docker compose up -d                 # start (no rebuild)
docker compose down                  # stop (keeps DB volume)
docker compose down -v               # stop AND DELETE the database!
docker compose pull                  # pull newer base images
docker compose up -d --build         # rebuild after code changes
```

### Update after `git pull`

```bash
git pull
docker compose up -d --build         # rebuild changed images, restart
```

Only the changed service rebuilds (layer caching makes it fast).

---

## 10. Data & persistence

| Data | Where it lives | Survives restart? |
|---|---|---|
| SQLite DB (`streaming.db`) | volume `surakshit-vms_backend-data` → `/data/streaming.db` | Yes |
| App logs | same volume → `/data/logs` | Yes |
| MediaMTX recordings | not enabled in this config | — |
| Built frontend | inside image (rebuild replaces it) | Rebuild needed |

**Backup the database:**

```bash
docker run --rm -v surakshit-vms_backend-data:/data -v "$PWD":/backup \
  alpine tar czf /backup/vms-backup.tar.gz -C /data .
```

**Restore:**

```bash
docker compose down
docker run --rm -v surakshit-vms_backend-data:/data -v "$PWD":/backup \
  alpine tar xzf /backup/vms-backup.tar.gz -C /data
docker compose up -d
```

---

## 11. Verify each service (troubleshooting quick checks)

```bash
# Frontend reachable
curl -I http://localhost

# Backend reachable through the nginx proxy (same path the browser uses)
curl http://localhost/api/v1/health

# Backend reachable directly
curl http://localhost:8080/api/v1/health

# MediaMTX control API
curl http://localhost:9997/v3/paths/list
```

All four should return HTTP 200 / JSON.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `docker: permission denied while trying to connect to the Docker daemon` | Log out/in after `usermod -aG docker`, or run commands with `sudo`. |
| Frontend loads but API calls fail (502/504) | `docker compose logs backend` — backend may still be migrating on first start. Wait 10s, refresh. |
| `npm run build` fails in Docker with `UNRESOLVED_IMPORT` | A file import has wrong capitalization. Linux is case-sensitive; Windows is not. Match import paths to real filenames exactly (e.g. `./HeaderTime`, not `./headerTime`). |
| Live video won't play from another PC | Set `MEDIAMTX_WEBRTC_URL=http://<SERVER_IP>:8889` in `.env`, then `docker compose up -d`. Also open UDP 8889 and 8189 in the firewall. |
| Backend can't add a camera (ONVIF/RTSP timeout) | The camera IP must be reachable **from the server**: `ping <camera-ip>`, `ffprobe rtsp://user:pass@<camera-ip>:554/...`. Check camera and server are on the same network/VLAN. |
| `edge-server` container name conflict | The compose project already uses it. Stop other stacks that define a container named `edge-server`. |
| Port already in use (`bind: address already in use`) | Change the host side in `.env` (`FRONTEND_PORT=8081`, `BACKEND_PORT=8081`) or find the culprit: `sudo ss -ltnp \| grep :80`. |
| Want a completely fresh start | `docker compose down -v` (deletes the DB) then `docker compose up -d --build`. |
| Disk filling up with old images | `docker image prune -a` (removes unused images — rebuild afterwards). |

---

## 13. Security checklist (before production / internet exposure)

- [ ] Change `BOOTSTRAP_ADMIN_PASSWORD` and log in to change it again in the UI.
- [ ] Set a long random `AUTH_SECRET_KEY` (e.g. `openssl rand -hex 32`).
- [ ] Do not expose ports **8080, 9997, 9998** to the internet — firewall them to your LAN only.
- [ ] Only ports **80** (and **8889** for WebRTC) should face untrusted networks.
- [ ] Keep `.env` out of version control (already gitignored — do not `git add -f` it).
- [ ] Cameras should sit on a segmented VLAN with credentials unique to the VMS.

---

## 14. Moving the stack to another machine

Because the images are portable linux/amd64 images, you can move them without rebuilding:

```bash
# On the OLD machine
docker save surakshit-vms-frontend surakshit-vms-backend bluenviron/mediamtx:1.19.3 \
  -o vms-images.tar

# On the NEW machine (after copying the .tar + project folder)
docker load -i vms-images.tar
nano .env          # update IPs + secrets
docker compose up -d
```

Or skip image transfer entirely — on the new machine just `git clone` and `docker compose up -d --build`.

Update `MEDIAMTX_WEBRTC_URL` and `CORS_ORIGINS` to the **new** server's IP in `.env`.

---

## 15. Reference — container internals

### backend (`edge-server`)

- Base: `python:3.12-slim`, plus `ffmpeg` (needed by the clip-export feature).
- Working dir: `/app` — contains `app/`, `alembic/`, `alembic.ini`, `requirements.txt`.
- Data dir: `/data` — SQLite DB at `/data/streaming.db`, logs at `/data/logs` (volume).
- Startup command:
  ```sh
  python -m alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8080
  ```
  Migrations are idempotent and run on every start.

### frontend

- Stage 1: `node:22-alpine` — `npm ci && npm run build` with `VITE_API_BASE_URL=/api/v1` baked in at build time (same-origin, so no CORS).
- Stage 2: `nginx:alpine` — serves `/usr/share/nginx/html` + `nginx.conf` (SPA fallback + `/api` proxy to `edge-server:8080`).
- To change the API URL after deploy you must **rebuild** the frontend:  
  `docker compose build --build-arg VITE_API_BASE_URL=/api/v1 frontend`

### mediamtx

- Official image `bluenviron/mediamtx:1.19.3` (replaces the old Windows `mediamtx.exe`).
- Config `mediamtx.yml` from the repo root is mounted read-only at `/mediamtx.yml`.
- Enabled protocols: RTSP (`:8554`), RTMP (`:1935`), WebRTC (`:8889` + UDP `:8189`). HLS/SRT disabled for CPU headroom during load tests.

---

## 16. Fake cameras for load testing (optional)

Generate test streams from the **host** (needs local ffmpeg: `sudo apt install ffmpeg`):

```bash
for i in $(seq 1 10); do
  ffmpeg -re -f lavfi -i "testsrc2=size=1280x720:rate=15" \
    -c:v libx264 -preset veryfast -tune zerolatency -g 30 \
    -f flv rtmp://localhost:1935/simcam_$i &
done
```

These appear in the VMS automatically (path `all_others` is enabled in `mediamtx.yml`). Kill them with `pkill ffmpeg` when done.

---

## Quick summary

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER
# (log out/in)

# 2. Get code
git clone https://github.com/akashdeep-tech-os/VMS-Video-Management-System.git
cd VMS-Video-Management-System && git checkout Development

# 3. Configure
nano .env     # secrets + MEDIAMTX_WEBRTC_URL=http://<SERVER_IP>:8889

# 4. Run
docker compose up -d --build

# 5. Browse
#    http://<SERVER_IP>   →  admin / admin123
```
