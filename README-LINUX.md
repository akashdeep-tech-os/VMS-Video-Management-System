# Running on Ubuntu / Linux

Everything in `README.md` works on Ubuntu (22.04 / 24.04) with three changes:

1. The vendored MediaMTX binary (`mediamtx_v1.19.3_windows_amd64/`) is
   **Windows-only** — download the Linux build (step 2).
2. The PowerShell scripts (`scripts/*.ps1`) do not run on Linux — use the bash
   commands below instead.
3. The virtualenv interpreter is `.venv/bin/python`, not
   `.venv\Scripts\python.exe`.

## 1. Install prerequisites

```bash
sudo apt update
sudo apt install -y curl git build-essential ffmpeg python3 python3-venv python3-pip
```

### Python 3.12+

```bash
python3 --version   # must be 3.12+
```

- **Ubuntu 24.04**: ships Python 3.12 — nothing to do.
- **Ubuntu 22.04**: ships 3.10 — install 3.12 from deadsnakes:

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv
```

### Node.js 20+

```bash
node --version   # must be 20+
```

If missing or too old, install from NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### ffmpeg (fake cameras)

```bash
ffmpeg -version   # installed by apt above
```

## 2. Download the MediaMTX Linux binary

```bash
cd /path/to/VMS-Video-Management-System

mkdir -p mediamtx_linux
curl -L -o /tmp/mediamtx.tar.gz \
  https://github.com/bluenviron/mediamtx/releases/download/v1.19.3/mediamtx_v1.19.3_linux_amd64.tar.gz
tar -xzf /tmp/mediamtx.tar.gz -C mediamtx_linux
chmod +x mediamtx_linux/mediamtx
```

Add to `.gitignore` if you do not want to commit it (`mediamtx_linux/`).

## 3. Configure environment

```bash
cp .env.example .env   # only if .env does not exist yet
```

Edit `.env` if needed. The backend reads `.env` from the **repo root**
(regardless of working directory); Vite reads it too (`envDir: ../`).

## 4. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv                # use python3.12 on Ubuntu 22.04
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# first run / after model changes: apply migrations
python -m alembic upgrade head

# start (Ctrl+C to stop)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Without activating the venv, run directly:

```bash
backend/.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Create a migration (equivalent of the Windows command in `README.md`):

```bash
cd backend
.venv/bin/python -m alembic revision --autogenerate -m "description"
.venv/bin/python -m alembic upgrade head
```

## 5. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

## 6. MediaMTX

```bash
# from the repo root
./mediamtx_linux/mediamtx ./mediamtx.yml
```

## 7. Start everything (one terminal)

Run from the repo root — starts all three services, Ctrl+C stops them all:

```bash
#!/usr/bin/env bash
set -e
trap 'kill 0' EXIT INT TERM

./mediamtx_linux/mediamtx ./mediamtx.yml &

(cd backend && .venv/bin/python -m uvicorn app.main:app --reload \
    --host 127.0.0.1 --port 8000) &

(cd frontend && npm run dev) &

wait
```

Save as `start-all.sh`, then:

```bash
chmod +x start-all.sh
./start-all.sh
```

Or use three terminals (or `tmux` panes), one command each from steps 4–6.

## 8. URLs

Same as the Windows setup:

| Service          | URL                       |
| ---------------- | ------------------------- |
| Frontend (Vite)  | http://localhost:5173     |
| Backend API      | http://localhost:8000     |
| API docs         | http://localhost:8000/docs|
| RTSP             | rtsp://localhost:8554     |
| RTMP             | rtmp://localhost:1935     |
| WebRTC (WHEP)    | http://localhost:8889     |
| MediaMTX API     | http://localhost:9997     |
| MediaMTX metrics | http://localhost:9998     |

## 9. Fake cameras (load testing)

Single manual stream:

```bash
ffmpeg -re -f lavfi -i testsrc2=size=640x360:rate=25 -an \
  -c:v libx264 -preset ultrafast -tune zerolatency -g 25 \
  -b:v 800k -maxrate 800k -bufsize 400k \
  -f flv rtmp://localhost:1935/cam_1
```

N simulated cameras at once (Ctrl+C stops all):

```bash
#!/usr/bin/env bash
COUNT=${1:-4}
FPS=${2:-25}
trap 'kill 0' EXIT INT TERM

for n in $(seq 1 "$COUNT"); do
  ffmpeg -re -f lavfi -i "testsrc2=size=640x360:rate=$FPS" -an \
    -c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p \
    -g "$FPS" -b:v 800k -maxrate 800k -bufsize 400k \
    -f flv "rtmp://localhost:1935/simcam_$n" &
  echo "  simcam_$n"
done

echo "Publishing. Ctrl+C to stop all cameras..."
wait
```

```bash
chmod +x start-fake-cameras.sh
./start-fake-cameras.sh        # 4 cameras at 25 fps
./start-fake-cameras.sh 16     # 16 cameras
./start-fake-cameras.sh 16 30  # 16 cameras at 30 fps
```

Watch any stream at `http://localhost:8889/simcam_1/whep`, or open
`http://localhost:5173/live` and pick a grid size.

## 10. WHEP smoke test

```bash
node frontend/scripts/whep-smoke-test.mjs
node frontend/scripts/whep-smoke-test.mjs simcam_1
```

## 11. Firewall (only for remote access)

Everything binds to localhost by default, so **no firewall changes are needed**
on the machine itself. To reach the UI/API from another machine, open the TCP
ports and adjust `.env` first:

```bash
sudo ufw allow 5173/tcp    # Vite dev server
sudo ufw allow 8000/tcp    # backend API
sudo ufw allow 8889/tcp    # MediaMTX WebRTC (WHEP)
sudo ufw allow 9997/tcp    # MediaMTX control API (optional)
```

Then in `.env`:

```
CORS_ORIGINS=http://<server-ip>:5173
VITE_API_BASE_URL=http://<server-ip>:8000/api/v1
MEDIAMTX_WEBRTC_URL=http://<server-ip>:8889
```

WebRTC also uses **UDP for media**; if video fails from a remote browser, allow
the UDP ports MediaMTX binds (`ss -lunp | grep mediamtx`) or test locally
first.

## 12. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `python3 --version` < 3.12 | Use `python3.12 -m venv .venv` (see step 1) |
| `ModuleNotFoundError` when starting uvicorn | Activate the venv: `source backend/.venv/bin/activate` |
| `Address already in use` | Find the old process: `sudo ss -ltnp \| grep :8000`, kill it |
| MediaMTX: `permission denied` | `chmod +x mediamtx_linux/mediamtx` |
| MediaMTX: `exec format error` | Wrong architecture — on ARM use `mediamtx_v1.19.3_linux_arm64.tar.gz` |
| Frontend can't reach API from LAN | Set `CORS_ORIGINS` and `VITE_API_BASE_URL` in `.env` (step 11) |
| Tiles stay `offline` | Check the stream exists: `curl -s http://localhost:9997/v3/paths/list \| python3 -m json.tool` |
| `npm install` build errors | `sudo apt install -y build-essential`, delete `frontend/node_modules`, retry |
| Ports in use by an old run | `pkill -f mediamtx; pkill -f uvicorn; pkill -f vite` |

## 13. Health check

```bash
curl -s http://localhost:8000/api/v1/health | python3 -m json.tool
curl -s http://localhost:8000/api/v1/system/health | python3 -m json.tool
```

Backend logs: `backend/logs/app.log` (rotating, 5 MB × 5 files).
