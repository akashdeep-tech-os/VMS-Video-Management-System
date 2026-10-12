FROM python:3.12-slim

# ffmpeg is required by app/api/routes/playback.py (clip export via subprocess)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persistent data dir: SQLite DB + logs live here (mount a volume in compose)
RUN mkdir -p /data/logs

ENV DATABASE_URL=sqlite:////data/streaming.db \
    LOG_DIR=/data/logs \
    API_HOST=0.0.0.0 \
    API_PORT=8080

EXPOSE 8080

# Apply DB migrations on every start (idempotent), then run uvicorn.
CMD ["sh", "-c", "python -m alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8080"]
