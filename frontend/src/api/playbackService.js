// Client for the SURAKSHIT PLAYBACK service (separate Spring Boot app on :8081).
//
// Unlike the edge/stream service, this service returns RAW JSON (no {data}
// envelope) and does NOT use the /api/v1 prefix - so it does NOT go through
// apiClient.js. It shares the same JWT though (same signing secret + users
// table), so we reuse the token stored by apiClient.
import { getToken } from "./apiClient";

const PLAYBACK_BASE =
  import.meta.env.VITE_PLAYBACK_API_BASE_URL || "http://localhost:8081";

const HLS_BASE =
  import.meta.env.VITE_MEDIAMTX_HLS_BASE_URL || "http://localhost:8888";

const WEBRTC_BASE =
  import.meta.env.VITE_MEDIAMTX_WEBRTC_BASE_URL || "http://localhost:8889";

function authHeaders(hasBody) {
  const headers = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** POST helper that returns the parsed JSON body (or throws with .status). */
async function post(path, body) {
  const res = await fetch(`${PLAYBACK_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const message = await extractError(res);
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function extractError(res) {
  try {
    const data = await res.json();
    return data?.message || data?.error?.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

const playbackService = {
  /**
   * Start recorded playback. Returns the PlaybackResponse
   * { cameraId, date, startTime, mediaMtxPath, webrtcUrl, status, ... }.
   */
  start({ cameraId, date, time }) {
    return post("/api/playback/start", { cameraId, date, time });
  },

  /** Seek: re-register the same camera/date from a new time. Same response shape. */
  seek({ cameraId, date, time }) {
    return post("/api/playback/seek", { cameraId, date, time });
  },

  /** Stop/de-register a MediaMTX playback path (frees the NVR session). */
  async stop(mediaMtxPath) {
    if (!mediaMtxPath) return;
    try {
      await fetch(
        `${PLAYBACK_BASE}/api/playback/stop?mediaMtxPath=${encodeURIComponent(mediaMtxPath)}`,
        { method: "DELETE", headers: authHeaders(false) }
      );
    } catch (err) {
      // Best-effort cleanup - never surface to the user.
      console.warn("playback stop failed:", err);
    }
  },

  /**
   * Download a recorded window as MP4. A plain <a href> can't send the Bearer
   * header, so we fetch to a Blob and save via a temporary object URL.
   */
  async download(cameraId, { date, startTime, endTime }) {
    const qs = new URLSearchParams({ date, startTime, endTime }).toString();
    const res = await fetch(
      `${PLAYBACK_BASE}/api/playback/download/${cameraId}?${qs}`,
      { headers: authHeaders(false) }
    );
    if (!res.ok) {
      const message = await extractError(res);
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `camera-${cameraId}_${date}_${startTime}-${endTime}.mp4`.replace(/:/g, "");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /**
   * Browser-playable HLS URL for a MediaMTX path. The path already contains the
   * literal slashes MediaMTX expects (playback/cam42/date/time), so it must NOT
   * be URL-encoded.
   */
  hlsUrlFromPath(mediaMtxPath) {
    if (!mediaMtxPath) return null;
    return `${HLS_BASE}/${mediaMtxPath}/index.m3u8`;
  },

  /**
   * MediaMTX's built-in WebRTC player page for a path (note: NO "/whep" suffix -
   * that bare endpoint is the raw WHEP signalling API; this URL is the ready-made
   * player page MediaMTX serves, which we embed in an <iframe>). Preferred over
   * HLS: MediaMTX's low-latency HLS muxer is unreliable for the fleet's H265
   * sources, and its own player correctly negotiates WHEP + HEVC where a
   * hand-rolled client is brittle. The path already contains the literal slashes
   * MediaMTX expects, so it must NOT be URL-encoded.
   */
  webrtcUrlFromPath(mediaMtxPath) {
    if (!mediaMtxPath) return null;
    return `${WEBRTC_BASE}/${mediaMtxPath}`;
  },
};

export default playbackService;
