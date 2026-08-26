import { useEffect, useRef } from "react";
import Hls from "hls.js";

/**
 * An HLS URL is an .m3u8 playlist; anything else we're handed is MediaMTX's
 * WebRTC player page (see LiveStreamingContext.webrtcPlayerUrl). Sniffing the
 * URL keeps the single `url` prop contract every caller already uses.
 */
function isHlsUrl(url) {
  return typeof url === "string" && url.includes(".m3u8");
}

function VideoPlayer({ url, muted = true, objectFit = "object-cover" }) {
  const videoRef = useRef(null);
  const webrtc = url && !isHlsUrl(url);

  // 1. Handle HLS Stream Loading & Auto-Recovery
  useEffect(() => {
    const video = videoRef.current;
    if (!url || !video || webrtc) return; // WebRTC renders an iframe, no <video>

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30, // Prevents RAM crashes
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      // Auto-heal network blips
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
    }
    // Safari Native Support
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }

    return () => {
      if (hls) hls.destroy();
      video.src = "";
      video.removeAttribute("src");
    };
  }, [url, webrtc]);

  // 2. React Autoplay Mute Fix:
  // Browsers are strict about autoplaying audio. This ensures the video element's
  // native muted property perfectly syncs with your React state when the user clicks the button.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // WebRTC: embed MediaMTX's own player page. It negotiates WHEP, handles ICE
  // and decodes H.265 correctly. Cross-origin, so the `muted` prop cannot reach
  // inside — the page autoplays muted by default, which is what a grid tile
  // wants anyway.
  if (webrtc) {
    return (
      <iframe
        key={url} // re-mount on change so the old peer connection is torn down
        src={url}
        title="live"
        allow="autoplay; fullscreen"
        className="absolute inset-0 w-full h-full border-0 bg-black pointer-events-none"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={`absolute inset-0 w-full h-full pointer-events-none ${objectFit}`}
    />
  );
}

export default VideoPlayer;
