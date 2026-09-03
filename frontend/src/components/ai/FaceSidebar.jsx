import React, { useState, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { FiVideo } from "react-icons/fi";
import { MdOutlineVideocamOff } from "react-icons/md";
import { motion } from "framer-motion";

const itemFade = {
  hidden: { opacity: 0, y: -4 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.02, duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FaceSidebar = React.memo(
  ({
    isMobile,
    showSidebar,
    setShowSidebar,
    cameraList,
    onSelectCamera,
    selectedCamera,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    const filteredCameras = useMemo(() => {
      if (!searchTerm.trim()) return cameraList || [];
      const lower = searchTerm.toLowerCase();
      return (cameraList || []).filter((cam) =>
        cam.toLowerCase().includes(lower),
      );
    }, [cameraList, searchTerm]);

    return (
      <>
        {isMobile && showSidebar && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <aside
          className={`
            h-full transition-all duration-300 ease-in-out
            border-r border-[var(--border-color)] bg-[var(--card-bg)] flex flex-col shrink-0
            ${isMobile ? "fixed left-0 top-0 bottom-0 z-[100] shadow-2xl" : "relative z-40"}
            ${showSidebar ? "w-[260px] translate-x-0" : "w-[260px] md:w-0 -translate-x-full md:translate-x-0 overflow-hidden md:opacity-100 opacity-0"}
          `}
        >
          {/* Purple ambient glow at top */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[var(--primary-color)]/[0.06] to-transparent pointer-events-none" />

          {/* Header with Search */}
          <div className="px-3 py-2.5 md:px-4 md:py-0 md:h-12 border-b border-[var(--border-color)] flex-shrink-0 relative flex items-center">
            {isMobile && (
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 mr-2 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--danger)] hover:text-white transition-colors text-[var(--text-muted)]"
              >
                <FaTimes size={14} />
              </button>
            )}

            {/* Search input */}
            <div
              className={`relative flex items-center flex-1 rounded-xl transition-all duration-300 border px-3 py-2 ${
                searchFocused
                  ? "border-[var(--primary-color)] shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                  : "border-[var(--border-color)] hover:border-[var(--text-muted)]/30"
              }`}
            >
              <FaSearch
                size={13}
                className={`shrink-0 transition-colors ${
                  searchFocused
                    ? "text-[var(--primary-color)]"
                    : "text-[var(--text-muted)]"
                }`}
              />
              <input
                type="text"
                placeholder="Find camera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-2.5 pr-2 py-0.5 text-sm bg-transparent text-[var(--text-dark)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="shrink-0 p-0.5 rounded-md hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Camera List */}
          <div className="p-2 text-sm overflow-y-auto flex-1 scrollbar-hide pb-20 md:pb-2">
            {filteredCameras.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60 h-32 mt-10">
                <MdOutlineVideocamOff size={36} className="mb-3 opacity-40" />
                <span className="text-sm font-medium">No cameras found</span>
                <span className="text-[10px] mt-1 opacity-70">
                  {searchTerm ? "Try a different search term" : "No cameras configured"}
                </span>
              </div>
            ) : (
              filteredCameras.map((cam, camIdx) => {
                const isSelected = selectedCamera === cam;

                return (
                  <motion.div
                    key={cam}
                    custom={camIdx}
                    variants={itemFade}
                    initial="hidden"
                    animate="visible"
                    className={`w-full flex items-center gap-2 pl-2 pr-3 py-1.5 mb-0.5 rounded-lg text-sm transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary-color)] text-white border-transparent shadow-[0_2px_10px_rgba(124,58,237,0.3)]"
                        : "bg-transparent border-transparent text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]"
                    }`}
                    onClick={() => onSelectCamera(cam)}
                  >
                    <FiVideo
                      className={`text-[15px] shrink-0 transition-colors ${
                        isSelected
                          ? "text-white"
                          : "text-[var(--primary-color)]/60"
                      }`}
                    />

                    <span className="truncate font-semibold tracking-wide leading-tight">
                      {cam}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </aside>
      </>
    );
  }
);

export default FaceSidebar;
