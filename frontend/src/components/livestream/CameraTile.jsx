import React, { useState, useEffect, useRef, useReducer, useCallback } from "react";
import { FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaLock } from "react-icons/fa";
import { MdVideocamOff } from "react-icons/md";
import { Camera, Move } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import PTZPanel from "./PTZPanel";

const CameraTile = React.memo(function CameraTile({
  cam,
  muted,
  onToggleAudio,
  onPTZ,
  streamUrl,
  isGridFullscreen,
  gridIndex,
  isSelected,
  isLocked,
  tileStatus,
  cameraMeta,
  onSelect,
  onContextMenu,
}) {
  const tileRef = useRef(null);
  const videoRef = useRef(null);
  const [showFullscreenPTZ, setShowFullscreenPTZ] = useState(false);
  const [isTileFullscreen, setIsTileFullscreen] = useState(false);
  const [, forceRender] = useReducer((x) => x + 1, 0);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onFSChange = () => {
      forceRender();
      const tileElement = tileRef.current;
      setIsTileFullscreen(
        document.fullscreenElement === tileElement ||
        document.webkitFullscreenElement === tileElement
      );
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setShowFullscreenPTZ(false);
      }
    };
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("webkitfullscreenchange", onFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("webkitfullscreenchange", onFSChange);
    };
  }, []);

  // iOS: Use video element's native fullscreen
  const requestVideoFullscreen = useCallback(() => {
    const video = tileRef.current?.querySelector("video");
    if (!video) return false;

    // iOS Safari supports webkitEnterFullscreen on video elements
    if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
      setIsTileFullscreen(true);
      return true;
    }
    // Standard fullscreen API fallback
    if (video.requestFullscreen) {
      video.requestFullscreen();
      return true;
    }
    return false;
  }, []);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!tileRef.current) return;

    // On iOS, use video element's native fullscreen
    if (isMobile) {
      requestVideoFullscreen();
      return;
    }

    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (tileRef.current.requestFullscreen) {
          tileRef.current.requestFullscreen();
        } else if (tileRef.current.webkitRequestFullscreen) {
          tileRef.current.webkitRequestFullscreen();
        }
      } else if (isTileFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } else {
        const exitPromise = document.exitFullscreen
          ? document.exitFullscreen()
          : document.webkitExitFullscreen();
        Promise.resolve(exitPromise).then(() => {
          setTimeout(() => {
            if (tileRef.current) {
              if (tileRef.current.requestFullscreen) {
                tileRef.current.requestFullscreen();
              } else if (tileRef.current.webkitRequestFullscreen) {
                tileRef.current.webkitRequestFullscreen();
              }
            }
          }, 100);
        }).catch(() => {});
      }
    } catch {}
  };

  // Touch double-tap handler for iOS
  const handleTouchEnd = useCallback((e) => {
    if (!isMobile) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      handleDoubleClick(e);
    }

    lastTapRef.current = now;
  }, [isMobile, handleDoubleClick]);

  const handleTileFullscreen = (e) => {
    e.stopPropagation();
    if (!tileRef.current) return;

    // On iOS, use video element's native fullscreen
    if (isMobile) {
      requestVideoFullscreen();
      return;
    }

    try {
      if (!isTileFullscreen) {
        if (document.fullscreenElement && document.fullscreenElement !== tileRef.current) {
          const exitPromise = document.exitFullscreen
            ? document.exitFullscreen()
            : document.webkitExitFullscreen();
          Promise.resolve(exitPromise).then(() => {
            setTimeout(() => {
              if (tileRef.current) {
                if (tileRef.current.requestFullscreen) tileRef.current.requestFullscreen();
                else if (tileRef.current.webkitRequestFullscreen) tileRef.current.webkitRequestFullscreen();
              }
            }, 100);
          }).catch(() => {});
        } else {
          if (tileRef.current.requestFullscreen) tileRef.current.requestFullscreen();
          else if (tileRef.current.webkitRequestFullscreen) tileRef.current.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch {}
  };

  const handleDragStart = (e) => {
    if (!cam) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `camera:${cam}`);
  };

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      onSelect?.(gridIndex, true);
    }
  };

  const handleContextMenuAction = (action) => {
    switch (action) {
      case "screenshot": {
        const canvas = document.createElement("canvas");
        const video = tileRef.current?.querySelector("video");
        if (video) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          const link = document.createElement("a");
          link.download = `${cam || "camera"}_${Date.now()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
        break;
      }
      case "ptz":
        if (isTileFullscreen) setShowFullscreenPTZ((p) => !p);
        else onPTZ?.(cam);
        break;
      case "fullscreen":
        handleTileFullscreen({ stopPropagation: () => {} });
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={tileRef}
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e.clientX, e.clientY, cam, gridIndex);
      }}
      draggable={!!cam}
      onDragStart={handleDragStart}
      className={`
        group relative bg-[#0a0a0a] border flex w-full h-full select-none overflow-hidden
        transition-all duration-200
        ${isSelected ? "border-blue-500 ring-2 ring-blue-500/40" : "border-[var(--border-color,rgba(255,255,255,0.1))]"}
        ${isLocked ? "ring-1 ring-amber-500/30" : ""}
      `}
    >
      {showFullscreenPTZ && (
        <div className={`${isMobile ? "absolute inset-0 z-30 pointer-events-none" : "shrink-0 h-full w-[260px] z-30"}`}>
          <div className={isMobile ? "pointer-events-auto" : "h-full"}>
            <PTZPanel cameraName={cam} onClose={() => setShowFullscreenPTZ(false)} fullHeight />
          </div>
        </div>
      )}

      <div className={`relative min-w-0 flex items-center justify-center ${showFullscreenPTZ && !isMobile ? "flex-1" : "w-full"}`}>
        {cam ? (
          <VideoPlayer url={streamUrl} muted={muted} objectFit="object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center text-[var(--text-muted,gray)] opacity-50 pointer-events-none">
            <MdVideocamOff size={32} className="mb-2" />
            <span className="text-xs tracking-wider uppercase font-medium">No Signal</span>
            <span className="text-[10px] opacity-60 mt-1">Drag camera here</span>
          </div>
        )}

        {/* === Lock Indicator === */}
        {isLocked && (
          <div className="absolute bottom-12 right-2 z-30 pointer-events-none">
            <div className="bg-amber-500/80 backdrop-blur-md p-1 rounded-md">
              <FaLock size={10} className="text-white" />
            </div>
          </div>
        )}

        {/* === Bottom Controls Bar === */}
        {cam && (
          <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <div className={`w-full px-2 pb-2 pt-6 flex justify-center items-center pointer-events-auto ${isMobile ? "gap-3" : "gap-2"}`}>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleAudio(cam); }}
                onDoubleClick={(e) => e.stopPropagation()}
                title={muted ? "Unmute" : "Mute"}
                className={`rounded-lg bg-black/60 hover:bg-blue-600 text-white transition-colors focus:outline-none ${isMobile ? "p-2.5" : "p-1.5"}`}
              >
                {muted ? <FaVolumeMute size={isMobile ? 18 : 14} /> : <FaVolumeUp size={isMobile ? 18 : 14} />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTileFullscreen) setShowFullscreenPTZ((p) => !p);
                  else if (onPTZ) onPTZ(cam);
                }}
                onDoubleClick={(e) => e.stopPropagation()}
                title="PTZ Controls"
                className={`rounded-lg transition-colors focus:outline-none ${isMobile ? "p-2.5" : "p-1.5"} ${
                  showFullscreenPTZ ? "bg-blue-600 text-white" : "bg-black/60 hover:bg-blue-600 text-white"
                } ${isMobile && !isTileFullscreen ? "hidden" : ""}`}
              >
                <Move size={isMobile ? 20 : 16} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleContextMenuAction("screenshot"); }}
                onDoubleClick={(e) => e.stopPropagation()}
                title="Screenshot"
                className={`rounded-lg bg-black/60 hover:bg-blue-600 text-white transition-colors focus:outline-none ${isMobile ? "p-2.5" : "p-1.5"}`}
              >
                <Camera size={isMobile ? 20 : 16} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleTileFullscreen({ stopPropagation: () => {} }); }}
                onDoubleClick={(e) => e.stopPropagation()}
                title={isTileFullscreen ? "Exit Tile Fullscreen" : "Tile Fullscreen"}
                className={`rounded-lg transition-colors focus:outline-none ${isMobile ? "p-2.5" : "p-1.5"} ${
                  isTileFullscreen ? "bg-blue-600 text-white" : "bg-black/60 hover:bg-blue-600 text-white"
                }`}
              >
                {isTileFullscreen ? <FaCompress size={isMobile ? 18 : 14} /> : <FaExpand size={isMobile ? 18 : 14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CameraTile;
