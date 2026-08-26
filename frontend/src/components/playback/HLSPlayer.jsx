import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { usePlayback } from "../../context/PlaybackContext";

function HLSPlayer({ url, zoom = 1, cameraId, registerVideoRef, unregisterVideoRef }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const { muted, playbackSpeed } = usePlayback();

  // Pan state
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  // Reset pan when zoom resets to 1
  useEffect(() => {
    if (zoom <= 1) {
      setTranslate({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      try { videoRef.current.playbackRate = playbackSpeed; } catch (e) { /* ignore */ }
    }
  }, [playbackSpeed]);

  // Mouse drag handlers for pan
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
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  useEffect(() => {
    if (!url || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = muted;
        video.playbackRate = playbackSpeed;
        video.play().catch(() => {});
      });

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
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.muted = muted;
      video.playbackRate = playbackSpeed;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.src = "";
        video.removeAttribute("src");
      }
    };
  }, [url]);

  // Register video ref for external control
  useEffect(() => {
    if (cameraId !== undefined && cameraId !== null && registerVideoRef) {
      registerVideoRef(cameraId, videoRef);
    }
    return () => {
      if (cameraId !== undefined && cameraId !== null && unregisterVideoRef) {
        unregisterVideoRef(cameraId);
      }
    };
  }, [cameraId, registerVideoRef, unregisterVideoRef]);

  const isZoomed = zoom > 1;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-black"
      onMouseDown={handleMouseDown}
      style={{ cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "default" }}
    >
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full object-cover bg-black transition-transform duration-150"
        style={{
          transform: `scale(${zoom}) translate(${translate.x / zoom}px, ${translate.y / zoom}px)`,
        }}
      />
    </div>
  );
}

export default HLSPlayer;
