import { useState, useEffect } from "react";
import {
  FaStepBackward,
  FaFastBackward,
  FaPlay,
  FaPause,
  FaStop,
  FaFastForward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
  FaDownload,
  FaCut,
  FaSearchPlus,
  FaSearchMinus,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import { usePlayback } from "../../Context/PlaybackContext";

function PlaybackToolbar() {
  const {
    isPlaying,
    play,
    pause,
    stopPlayback,
    currentTime,
    formatTime,
    playbackSpeed,
    isRewinding,
    rewindSpeed,
    stepForward,
    stepBackward,
    fastForward,
    rewind,
    muted,
    toggleMute,
    clipStart,
    clipEnd,
    setClipIn,
    setClipOut,
    clearClip,
    setShowClipModal,
    setShowDownloadModal,
    fullscreenCamera,
    setFullscreenCamera,
    videoZoom,
    setVideoZoom,
    selectedCameras,
    streamUrl,
    isNvrConnected,
  } = usePlayback();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleZoomIn = () => setVideoZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setVideoZoom((z) => Math.max(z - 0.25, 0.5));
  const handleZoomReset = () => setVideoZoom(1);

  const toggleFullscreen = () => {
    if (fullscreenCamera) {
      setFullscreenCamera(null);
    } else if (selectedCameras.length > 0 && streamUrl) {
      setFullscreenCamera({
        name: selectedCameras[0],
        url: streamUrl,
      });
    }
  };

  const ToolBtn = ({
    onClick,
    children,
    title,
    active,
    disabled,
    mobileOnly,
    desktopOnly,
  }) => {
    if (mobileOnly && !isMobile) return null;
    if (desktopOnly && isMobile) return null;

    return (
      <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`rounded-lg transition-all duration-200 ${
          isMobile ? "p-2.5" : "p-2"
        } ${
          active
            ? "bg-[var(--primary-color)] text-white shadow-md"
            : "text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)]"
        } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
      >
        {children}
      </button>
    );
  };

  const getSpeedLabel = () => {
    if (isRewinding) return `${Math.abs(rewindSpeed)}x`;
    if (playbackSpeed !== 1 || isPlaying) return `${playbackSpeed}x`;
    return null;
  };

  // Mobile layout: compact two-row design
  if (isMobile) {
    return (
      <div className="bg-[var(--card-bg)] border-t border-[var(--border-color)] px-2 py-1.5">
        {/* Row 1: Time + Main Controls */}
        <div className="flex items-center justify-between gap-1">
          {/* Time */}
          <span className="text-[10px] text-[var(--text-muted)] font-mono tabular-nums shrink-0">
            {formatTime(currentTime)}
          </span>

          {/* Speed indicator */}
          {getSpeedLabel() && (
            <span className="text-[9px] text-[var(--primary-color)] font-bold tabular-nums shrink-0">
              {getSpeedLabel()}
            </span>
          )}

          {/* Main Playback Controls */}
          <div className="flex items-center gap-0.5">
            <ToolBtn onClick={stepBackward} title="Previous Frame" mobileOnly>
              <FaStepBackward size={12} />
            </ToolBtn>

            {!isNvrConnected && (
              <ToolBtn onClick={rewind} title="Rewind" mobileOnly>
                <FaFastBackward size={12} />
              </ToolBtn>
            )}

            <ToolBtn
              onClick={() => (isPlaying ? pause() : play())}
              title={isPlaying ? "Pause" : "Play"}
              active
            >
              {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
            </ToolBtn>

            <ToolBtn onClick={stopPlayback} title="Stop">
              <FaStop size={12} />
            </ToolBtn>

            {!isNvrConnected && (
              <ToolBtn onClick={fastForward} title="Fast Forward" mobileOnly>
                <FaFastForward size={12} />
              </ToolBtn>
            )}

            <ToolBtn onClick={stepForward} title="Next Frame" mobileOnly>
              <FaStepForward size={12} />
            </ToolBtn>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-0.5">
            <ToolBtn onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
              {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
            </ToolBtn>
            <ToolBtn
              onClick={toggleFullscreen}
              title={fullscreenCamera ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreenCamera ? (
                <FaCompress size={12} />
              ) : (
                <FaExpand size={12} />
              )}
            </ToolBtn>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="bg-[var(--card-bg)] border-t border-[var(--border-color)] flex items-center gap-1 px-4 py-2">
      {/* Current Time */}
      <span className="text-[15px] text-[var(--text-dark)] font-semibold  tabular-nums w-20 shrink-0">
        {formatTime(currentTime)}
      </span>

      {/* Speed indicator */}
      {getSpeedLabel() && (
        <span className="text-[10px] text-[var(--primary-color)] font-bold tabular-nums w-8 shrink-0">
          {getSpeedLabel()}
        </span>
      )}

      {/* Playback Controls */}
      <div className="flex items-center gap-0.5 mx-auto">
        <ToolBtn onClick={stepBackward} title="Previous Frame">
          <FaStepBackward size={14} />
        </ToolBtn>

        {!isNvrConnected && (
          <ToolBtn
            onClick={rewind}
            title={`Rewind (${isRewinding ? Math.abs(rewindSpeed) : 1}x)`}
          >
            <FaFastBackward size={14} />
          </ToolBtn>
        )}

        <ToolBtn
          onClick={() => (isPlaying ? pause() : play())}
          title={isPlaying ? "Pause" : "Play"}
          active
        >
          {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </ToolBtn>

        <ToolBtn onClick={stopPlayback} title="Stop">
          <FaStop size={14} />
        </ToolBtn>

        {!isNvrConnected && (
          <ToolBtn
            onClick={fastForward}
            title={`Fast Forward (${playbackSpeed}x)`}
          >
            <FaFastForward size={14} />
          </ToolBtn>
        )}

        <ToolBtn onClick={stepForward} title="Next Frame">
          <FaStepForward size={14} />
        </ToolBtn>

        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

        <ToolBtn onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
          {muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
        </ToolBtn>

        <ToolBtn
          onClick={() => {
            if (clipStart !== null && clipEnd !== null) {
              setShowClipModal(true);
            } else if (clipStart === null) {
              setClipIn();
            } else {
              setClipOut();
            }
          }}
          title={
            clipStart !== null && clipEnd !== null
              ? "Export Clip"
              : clipStart !== null
                ? "Set Out Point"
                : "Set In Point"
          }
          active={clipStart !== null}
        >
          <FaCut size={14} />
        </ToolBtn>

        {clipStart !== null && (
          <ToolBtn onClick={clearClip} title="Clear Clip">
            <span className="text-[10px] font-bold">X</span>
          </ToolBtn>
        )}

        <ToolBtn
          onClick={() => setShowDownloadModal(true)}
          title="Download Recording"
        >
          <FaDownload size={14} />
        </ToolBtn>
      </div>

      {/* Right side controls */}
      <div className="flex items-center text-[var(--text-dark)] gap-0.5 shrink-0">
        <ToolBtn onClick={handleZoomOut} title="Zoom Out Video">
          <FaSearchMinus size={15} />
        </ToolBtn>
        <span className="text-[13px] text-[var(--text-dark)] font-semibold tabular-nums w-8 text-center">
          {videoZoom.toFixed(1)}x
        </span>
        <ToolBtn onClick={handleZoomIn} title="Zoom In Video">
          <FaSearchPlus size={15} />
        </ToolBtn>

        <ToolBtn
          onClick={toggleFullscreen}
          title={fullscreenCamera ? "Exit Fullscreen" : "Fullscreen"}
        >
          {fullscreenCamera ? <FaCompress size={15} /> : <FaExpand size={15} />}
        </ToolBtn>
      </div>
    </div>
  );
}

export default PlaybackToolbar;
