import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaExpand, FaCompress } from "react-icons/fa";

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const docEl = document.documentElement;
        // Standard API with Safari Fallback
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }
      } else {
        // Standard API with Safari Fallback
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        // Force layout reflow so flex containers recalculate after fullscreen exit
        document.body.offsetHeight;
        window.dispatchEvent(new Event("resize"));
      }
    } catch (err) {
      console.error(`Fullscreen toggle failed: ${err.message}`);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check both standard and webkit properties to sync state accurately
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement),
      );
    };

    // Listen for both standard and Safari-specific exit events (e.g., pressing ESC)
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={toggleFullscreen}
      // ✅ Accessibility & UX enhancements
      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      className="
        p-2.5 rounded-xl
        hover:bg-[var(--hover-bg)]
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        transition-all duration-300
      "
    >
      {isFullscreen ? (
        <FaCompress className="text-[14px] text-[var(--icon-color)]" />
      ) : (
        <FaExpand className="text-[14px] text-[var(--icon-color)]" />
      )}
    </motion.button>
  );
}

export default FullscreenButton;
