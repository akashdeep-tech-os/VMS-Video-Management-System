import { useRef, useState, useCallback, useEffect } from "react";
import { FaPause } from "react-icons/fa";

/**
 * Native WHEP player for a recorded MediaMTX stream.
 *
 * WHY NATIVE (not the old cross-origin iframe): rendering the stream into a real
 * <video> we own lets the app's Play/Pause drive video.play()/video.pause() on a
 * SINGLE, persistent WebRTC connection. Pause freezes the current frame without
 * tearing down the peer connection, and Play resumes the SAME stream - no new
 * WHEP negotiation on every toggle (which is what the iframe forced).
 *
 * `url` is MediaMTX's player-page url (http://<host>:8889/{path}); the raw WHEP
 * signalling endpoint is `${url}/whep`. A timeline seek re-registers the backend
 * path and swaps `url`, which tears down and reconnects here (a new position IS
 * a new stream - expected).
 *
 * Uses the browser's own WebRTC stack (same decoder the iframe player used), so
 * codec support is identical to before.
 */

// --- MediaMTX WHEP handshake helpers (mirrors MediaMTX's own reader.js) ---
// MediaMTX expects the offer POSTed immediately (before ICE gathering), then
// local candidates trickled via PATCH to the session resource (Location header).

// Pull ice-ufrag / ice-pwd and the m= lines from our local offer so we can build
// the SDP fragments that carry trickled candidates.
function parseOffer(sdp) {
  const ret = { iceUfrag: "", icePwd: "", medias: [] };
  for (const line of sdp.split("\r\n")) {
    if (line.startsWith("m=")) {
      ret.medias.push(line.slice(2));
    } else if (ret.iceUfrag === "" && line.startsWith("a=ice-ufrag:")) {
      ret.iceUfrag = line.slice("a=ice-ufrag:".length);
    } else if (ret.icePwd === "" && line.startsWith("a=ice-pwd:")) {
      ret.icePwd = line.slice("a=ice-pwd:".length);
    }
  }
  return ret;
}

// Build an application/trickle-ice-sdpfrag body for one or more candidates.
function generateSdpFragment(offerData, candidates) {
  const byMedia = {};
  for (const c of candidates) {
    const mid = c.sdpMLineIndex;
    if (byMedia[mid] === undefined) byMedia[mid] = [];
    byMedia[mid].push(c);
  }

  let frag = `a=ice-ufrag:${offerData.iceUfrag}\r\na=ice-pwd:${offerData.icePwd}\r\n`;
  let mid = 0;
  for (const media of offerData.medias) {
    if (byMedia[mid] !== undefined) {
      frag += `m=${media}\r\na=mid:${mid}\r\n`;
      for (const c of byMedia[mid]) {
        frag += `a=${c.candidate}\r\n`;
      }
    }
    mid++;
  }
  return frag;
}

// Negotiate WHEP against MediaMTX. Returns the session resource URL (for trickle
// PATCH + DELETE on teardown) and wires trickled candidates onto `pc`.
async function negotiateWhep(pc, playerUrl) {
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const offerData = parseOffer(offer.sdp);

  const res = await fetch(`${playerUrl}/whep`, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: offer.sdp,
  });
  if (res.status !== 201) {
    // 404 = path exists but its source (NVR re-stream) hasn't started yet;
    // the caller retries until it's ready, like MediaMTX's own player.
    throw new Error(`WHEP negotiation failed (${res.status})`);
  }

  const etag = res.headers.get("ETag") || res.headers.get("E-Tag") || "*";
  const locationHeader = res.headers.get("Location") || "";
  // Location may be relative to the WHEP endpoint.
  const sessionUrl = new URL(locationHeader, `${playerUrl}/whep`).href;

  const answerSdp = await res.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  // Trickle local candidates to the session resource as they are gathered.
  pc.onicecandidate = (evt) => {
    if (!evt.candidate) return;
    const body = generateSdpFragment(offerData, [evt.candidate]);
    fetch(sessionUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/trickle-ice-sdpfrag",
        "If-Match": etag,
      },
      body,
    }).catch((err) => console.warn("WHEP candidate PATCH failed:", err));
  };

  return sessionUrl;
}

function WebRTCPlayer({ url, zoom = 1, paused = false, muted = true }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Pan state (matches the old player so zoom-and-drag still works on the tile).
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  const applied = zoom > 1 ? translate : { x: 0, y: 0 };

  // Establish the WHEP connection when the stream url changes; tear it down on
  // unmount or before reconnecting (a seek). Pause/play do NOT run this - they
  // only toggle the <video>, keeping this one connection alive.
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let pc = null;
    let sessionUrl = null;
    let retryTimer = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 15; // ~22s at 1.5s spacing before surfacing an error.

    const teardownPc = () => {
      if (sessionUrl) {
        fetch(sessionUrl, { method: "DELETE" }).catch(() => {});
        sessionUrl = null;
      }
      if (pc) {
        try { pc.close(); } catch { /* ignore */ }
        pc = null;
      }
    };

    const scheduleRetry = () => {
      if (cancelled) return;
      teardownPc();
      if (attempts >= MAX_ATTEMPTS) {
        setError("Stream unavailable");
        setConnecting(false);
        return;
      }
      setConnecting(true);
      retryTimer = setTimeout(connect, 1500);
    };

    const connect = async () => {
      if (cancelled) return;
      attempts += 1;
      teardownPc();

      pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;
      const thisPc = pc;

      const stream = new MediaStream();
      thisPc.ontrack = (e) => {
        stream.addTrack(e.track);
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Media is flowing - drop the "Connecting…" overlay.
        if (!cancelled) { setConnecting(false); setError(null); }
      };

      thisPc.onconnectionstatechange = () => {
        if (cancelled || thisPc !== pc) return;
        if (thisPc.connectionState === "failed") scheduleRetry();
      };

      try {
        const session = await negotiateWhep(thisPc, url);
        if (cancelled) { teardownPc(); return; }
        sessionUrl = session;
      } catch (err) {
        if (cancelled) return;
        console.warn(`WHEP attempt ${attempts} failed, retrying:`, err.message);
        scheduleRetry();
      }
    };

    setConnecting(true);
    setError(null);
    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      teardownPc();
      pcRef.current = null;
    };
  }, [url]);

  // Mirror the app Play/Pause onto the actual <video> - same stream, no reconnect.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
  }, [paused, connecting]);

  // Keep the <video> muted state in sync with the toolbar's mute button.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
  }, [zoom, translate]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({ x: translateStart.current.x + dx, y: translateStart.current.y + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const isZoomed = zoom > 1;

  if (!url) return <div className="w-full h-full bg-black" />;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black"
      onMouseDown={handleMouseDown}
      style={{ cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "default" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-contain bg-black transition-transform duration-150"
        style={{
          transform: `scale(${zoom}) translate(${applied.x / zoom}px, ${applied.y / zoom}px)`,
          pointerEvents: isZoomed ? "none" : "auto",
        }}
      />

      {/* Paused: the <video> is frozen on its last frame; show a subtle badge. */}
      {paused && !connecting && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 bg-black/25 select-none pointer-events-none">
          <FaPause size={26} />
          <span className="text-xs">Paused</span>
        </div>
      )}

      {connecting && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs bg-black/40 select-none pointer-events-none">
          Connecting…
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-300 text-xs bg-black/60 select-none pointer-events-none">
          {error}
        </div>
      )}
    </div>
  );
}

export default WebRTCPlayer;
