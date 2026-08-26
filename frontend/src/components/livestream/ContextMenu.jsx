import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaVideo, FaExpand, FaPlay, FaLock, FaUnlock, FaImage, FaCog } from "react-icons/fa";
import { Move } from "lucide-react";

export default function ContextMenu({ x, y, cam, gridIndex, onClose, actions }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 320);

  const menuItems = [
    { icon: FaImage, label: "Screenshot", action: "screenshot", color: "text-blue-500" },
    { icon: FaVideo, label: "Start Recording", action: "record", color: "text-red-500" },
    { icon: FaPlay, label: "View Playback", action: "playback", color: "text-green-500" },
    { divider: true },
    { icon: Move, label: "PTZ Controls", action: "ptz", color: "text-purple-500" },
    { icon: FaExpand, label: "Fullscreen", action: "fullscreen", color: "text-indigo-500" },
    { divider: true },
    { icon: actions?.isLocked ? FaUnlock : FaLock, label: actions?.isLocked ? "Unlock Tile" : "Lock Tile", action: "lock", color: "text-amber-500" },
    { icon: FaCog, label: "Camera Settings", action: "settings", color: "text-gray-500" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -5 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[200] w-[200px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {/* Camera Name Header */}
        <div className="px-3 py-2 border-b border-[var(--border-color)] bg-[var(--hover-bg)]">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Camera</p>
          <p className="text-[12px] font-bold text-[var(--text-dark)] truncate">{cam || "Empty Slot"}</p>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {menuItems.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="my-1 border-t border-[var(--border-color)]" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  actions?.[item.action]?.();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              >
                <Icon size={13} className={item.color} />
                {item.label}
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
