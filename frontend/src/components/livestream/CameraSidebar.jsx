import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { FiVideo } from "react-icons/fi";
import { MdOutlineVideocamOff } from "react-icons/md";
import { useLiveStreaming } from "../../context/LiveStreamingContext";
import PTZPanel from "./PTZPanel";

const CustomCheckbox = ({
  checked,
  indeterminate,
  onChange,
  size = "md",
  disabled = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-[18px] h-[18px]",
  };

  return (
    <label
      className="flex items-center shrink-0 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`
        ${sizeClasses[size]} rounded border transition-all duration-200
        flex items-center justify-center
        ${
          checked
            ? "bg-[var(--primary-color)] border-[var(--primary-color)] shadow-[0_0_8px_rgba(var(--primary-color-rgb,124,58,237),0.3)]"
            : "bg-white border-slate-400 hover:border-slate-600 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary-color)]/30"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {!checked && indeterminate && (
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 5H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </label>
  );
};

const itemFade = {
  hidden: { opacity: 0, y: -4 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.02, duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  }),
};

const CameraSidebar = React.memo(
  ({
    isMobile,
    showSidebar,
    setShowSidebar,
    cameraList,
    toggleCamera,
    selectedCams,
    activePTZCamera,
    onClosePTZ,
  }) => {
    const {
      selectAllCameras,
      clearAllCameras,
      selectedCams: allSelectedCams,
    } = useLiveStreaming();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    const allCamsCount = cameraList?.length || 0;

    const filteredCameras = useMemo(() => {
      if (!searchTerm.trim()) return cameraList || [];
      const lower = searchTerm.toLowerCase();
      return (cameraList || []).filter((cam) =>
        cam.toLowerCase().includes(lower),
      );
    }, [cameraList, searchTerm]);

    const highlightText = (text, term) => {
      if (!term.trim()) return text;
      const parts = text.split(
        new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
      );
      return parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <span key={i} className="bg-yellow-300/50 rounded px-0.5">
            {part}
          </span>
        ) : (
          part
        ),
      );
    };

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

          {/* ── HEADER ──────────────────────────────── */}
          <div className="px-3 py-2.5 md:px-4 md:py-0 md:h-12 border-b border-[var(--border-color)] flex-shrink-0 relative flex items-center gap-2.5">
            {isMobile && (
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 mr-2 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--danger)] hover:text-white transition-colors text-[var(--text-muted)]"
              >
                <FaTimes size={14} />
              </button>
            )}

            {/* Select All Checkbox */}
            <CustomCheckbox
              checked={
                allSelectedCams.length === allCamsCount && allCamsCount > 0
              }
              indeterminate={
                allSelectedCams.length > 0 &&
                allSelectedCams.length < allCamsCount
              }
              onChange={() => {
                if (allSelectedCams.length === allCamsCount) {
                  clearAllCameras();
                } else {
                  selectAllCameras();
                }
                if (isMobile) setShowSidebar(false);
              }}
              size="md"
            />

            {/* Search input */}
            <div
              className={`relative flex items-center flex-1 rounded-xl transition-all duration-300 border px-3 py-1 ${
                searchFocused
                  ? "border-[var(--primary-color)] shadow-[0_0_12px_rgba(var(--primary-color-rgb,124,58,237),0.15)]"
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

          {/* ── TOOLBAR ──────────────────────────────── */}
          <div className="px-3 py-1.5 md:px-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--hover-bg)]/50">
            <span className="text-[13px] text-[var(--text-muted)]">
              {filteredCameras.length} camera{filteredCameras.length !== 1 ? "s" : ""}
            </span>
            {allSelectedCams.length > 0 && (
              <button
                onClick={() => {
                  clearAllCameras();
                  if (isMobile) setShowSidebar(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[14px] font-medium text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                title="Clear all selections"
              >
                <FaTimes size={9} />
                Clear ({allSelectedCams.length})
              </button>
            )}
          </div>

          {/* ── CAMERA LIST ────────────────────────── */}
          <div className="p-2 text-sm overflow-y-auto flex-1 scrollbar-hide pb-20 md:pb-2">
            {filteredCameras.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60 h-32 mt-10">
                <MdOutlineVideocamOff size={36} className="mb-3 opacity-40" />
                <span className="text-sm font-medium">
                  {searchTerm ? "No matching cameras" : "No cameras available"}
                </span>
                <span className="text-[10px] mt-1 opacity-70">
                  {searchTerm ? (
                    <>
                      No results for "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="block mx-auto mt-1 text-[var(--primary-color)] hover:underline"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    "No cameras configured"
                  )}
                </span>
              </div>
            ) : (
              filteredCameras.map((cam, camIdx) => {
                const isSelected = selectedCams.includes(cam);

                return (
                  <div
                    key={cam}
                    className="relative mb-1 pl-0.5"
                  >
                    <div
                      className={`w-full flex items-center gap-2 py-1.5 pl-2.5 pr-2 rounded-lg text-lg md:text-xs transition-all border cursor-pointer
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                            : "bg-transparent border-transparent text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]"
                        }
                      `}
                      onClick={() => {
                        toggleCamera(cam);
                        if (isMobile) setShowSidebar(false);
                      }}
                    >
                      <FiVideo
                        className={`text-[15px] shrink-0 transition-colors ${
                          isSelected
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-[var(--primary-color)]/60"
                        }`}
                      />

                      <div className="flex flex-col text-left overflow-hidden w-full">
                        <span className="truncate text-[12px] font-semibold tracking-wide leading-tight">
                          {highlightText(cam, searchTerm)}
                        </span>
                      </div>

                      {/* Camera status indicator */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-emerald-500 dark:bg-emerald-500"
                            : "bg-emerald-500"
                        }`}
                        title="Online"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PTZ Panel - shown at bottom when active */}
          {activePTZCamera && (
            <div className="shrink-0">
              <PTZPanel cameraName={activePTZCamera} onClose={onClosePTZ} />
            </div>
          )}
        </aside>
      </>
    );
  },
);

export default CameraSidebar;
