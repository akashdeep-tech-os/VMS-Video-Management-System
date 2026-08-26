import { useState, useEffect } from "react";
import { PlaybackProvider, usePlayback } from "../Context/PlaybackContext";
import PlaybackGrid from "../components/playback/PlaybackGrid";
import LeftPanel from "../components/playback/LeftPanel";
import PlaybackToolbar from "../components/playback/PlaybackToolbar";
import MultiTimeline from "../components/playback/MultiTimeline";
import WebRTCPlayer from "../components/playback/WebRTCPlayer";
import DownloadModal from "../components/playback/DownloadModal";

import BodyHead from "../components/common/BodyHead";
import { IoReorderThreeOutline } from "react-icons/io5";
import {
  FaPlayCircle,
  FaTimes,
  FaPause,
  FaPlay,
  FaStepBackward,
  FaFastBackward,
  FaFastForward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
  FaCompress,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function PlaybackContent() {
  const {
    currentTime,
    formatTime,
    isPlaying,
    play,
    pause,
    muted,
    toggleMute,
    fullscreenCamera,
    setFullscreenCamera,
    statusMessage,
    showDownloadModal,
  } = usePlayback();

  // Local state for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && fullscreenCamera) {
        setFullscreenCamera(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenCamera, setFullscreenCamera]);

  return (
    <div className="h-full w-full flex bg-[var(--bg-color)] text-[var(--text-dark)] overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* LEFT PANEL */}
      {isMobile ? (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-[100] w-[280px] shadow-2xl"
            >
              <LeftPanel
                collapsed={false}
                isMobile={isMobile}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div
          className={`transition-all duration-300 ${sidebarOpen ? "w-[260px] min-w-[260px]" : "w-0 min-w-0"} overflow-hidden flex-shrink-0`}
        >
          <LeftPanel collapsed={!sidebarOpen} isMobile={false} />
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <BodyHead>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg transition"
            >
              <IoReorderThreeOutline
                className="text-[var(--text-dark)]"
                size={22}
              />
            </button>
            <div className="flex-shrink-0">
              <FaPlayCircle className="text-[var(--primary-color)] text-[22px]" />
            </div>
            <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
              Playback
            </h2>
          </div>
        </BodyHead>

        {/* Status Message */}
        {statusMessage && (
          <div className="px-4 py-2 bg-[var(--primary-color)]/10 border-b border-[var(--primary-color)]/20 text-xs text-[var(--primary-color)] font-medium">
            {statusMessage}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <PlaybackGrid />
        </div>

        <div className="flex-shrink-0">
          <PlaybackToolbar />
        </div>

        <div className="flex-shrink-0">
          <MultiTimeline />
        </div>
      </div>

      {/* VIDEO FULLSCREEN OVERLAY */}
      {fullscreenCamera && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          {/* Close button */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setFullscreenCamera(null)}
              className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Camera name */}
          <div className="absolute top-4 left-4 z-20">
            <span className="text-sm bg-black/60 px-3 py-1 rounded text-white">
              {fullscreenCamera.name}
            </span>
          </div>

          {/* Double click hint */}
          <div className="absolute top-4 right-4 z-20">
            <span className="text-xs bg-black/60 px-2 py-1 rounded text-white">
              Double click to exit
            </span>
          </div>

          {/* Video */}
          <div
            className="flex-1 min-h-0"
            onDoubleClick={() => setFullscreenCamera(null)}
          >
            <WebRTCPlayer
              url={fullscreenCamera.url}
              zoom={1}
              paused={!isPlaying}
              muted={muted}
              cameraId={`fs-${fullscreenCamera.name}`}
              registerVideoRef={() => {}}
              unregisterVideoRef={() => {}}
            />
          </div>

          {/* Controls bar */}
          <div className="shrink-0 bg-black/90 px-6 py-3 flex items-center gap-4">
            <button
              onClick={() => (isPlaying ? pause() : play())}
              className="text-white hover:text-[var(--primary-color)] transition-colors"
            >
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>
            <span className="text-xs text-white font-mono">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary-color)] rounded-full"
                style={{ width: `${(currentTime / 86400) * 100}%` }}
              />
            </div>
            <button
              onClick={toggleMute}
              className="text-white hover:text-[var(--primary-color)] transition-colors"
            >
              {muted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
            </button>
            <button
              onClick={() => setFullscreenCamera(null)}
              className="text-white hover:text-[var(--primary-color)] transition-colors"
              title="Exit fullscreen"
            >
              <FaCompress size={16} />
            </button>
          </div>
        </div>
      )}

      {/* DOWNLOAD MODAL */}
      {showDownloadModal && <DownloadModal />}
    </div>
  );
}

function Playback() {
  return (
    <PlaybackProvider>
      <PlaybackContent />
    </PlaybackProvider>
  );
}

export default Playback;
