import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  FaChevronDown,
  FaSearch,
  FaTimes,
  FaGripVertical,
  FaChevronRight,
  FaChevronUp,
} from "react-icons/fa";
import { FiVideo } from "react-icons/fi";
import { MdOutlineVideocamOff } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveStreaming } from "../../Context/LiveStreamingContext";
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

const groupExpand = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
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
    cameraGroups,
    openGroups,
    toggleGroup,
    toggleCamera,
    selectedCams,
    activePTZCamera,
    onClosePTZ,
  }) => {
    const {
      reorderCamera,
      selectAllInGroup,
      clearAll,
      selectAll,
      selectedCams: allSelectedCams,
    } = useLiveStreaming();
    const [searchTerm, setSearchTerm] = useState("");
    const [dragItem, setDragItem] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const [allExpanded, setAllExpanded] = useState(true);

    const allCamsCount = useMemo(() => {
      return cameraGroups.flatMap((g) => g.sites.flatMap((s) => s.cameras))
        .length;
    }, [cameraGroups]);

    const dragNode = useRef(null);

    const filteredGroups = useMemo(() => {
      if (!searchTerm.trim()) return cameraGroups;
      const lower = searchTerm.toLowerCase();
      return cameraGroups
        .map((group) => ({
          ...group,
          sites: group.sites
            .map((site) => ({
              ...site,
              cameras: site.cameras.filter((cam) =>
                cam.toLowerCase().includes(lower),
              ),
            }))
            .filter(
              (site) =>
                site.name.toLowerCase().includes(lower) ||
                site.cameras.length > 0,
            ),
        }))
        .filter(
          (group) =>
            group.name.toLowerCase().includes(lower) || group.sites.length > 0,
        );
    }, [cameraGroups, searchTerm]);

    const handleDragStart = (e, groupName, index, camName) => {
      dragNode.current = { group: groupName, index, camName };
      setDragItem({ group: groupName, index, camName });
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `camera:${camName}`);
    };

    const handleDragOver = (e, groupName, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (
        dragItem &&
        (dragItem.group !== groupName || dragItem.index !== index)
      ) {
        setDropTarget({ group: groupName, index });
      }
    };

    const handleDragLeave = () => {
      setDropTarget(null);
    };

    const handleDrop = (e, groupName, index) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("text/plain");

      if (raw.startsWith("camera:")) {
        const camName = raw.replace("camera:", "");
        const allCams = cameraGroups
          .find((g) => g.name === groupName)
          ?.sites.flatMap((s) => s.cameras);
        const fromIdx = allCams?.indexOf(camName);

        if (fromIdx !== undefined && fromIdx !== -1 && fromIdx !== index) {
          reorderCamera(groupName, fromIdx, index);
        }
      }

      setDragItem(null);
      setDropTarget(null);
      dragNode.current = null;
    };

    const handleDragEnd = () => {
      setDragItem(null);
      setDropTarget(null);
      dragNode.current = null;
    };

    const isDragging = (groupName, index) =>
      dragItem?.group === groupName && dragItem?.index === index;

    const isDropOver = (groupName, index) =>
      dropTarget?.group === groupName && dropTarget?.index === index;

    const handleSelectAllInGroup = useCallback(
      (groupName) => {
        selectAllInGroup(groupName);
        if (isMobile) setShowSidebar(false);
      },
      [selectAllInGroup, isMobile, setShowSidebar],
    );

    const toggleAllGroups = useCallback(() => {
      const newExpanded = !allExpanded;
      setAllExpanded(newExpanded);
      cameraGroups.forEach((group) => {
        const groupKey = group.name;
        if (openGroups[groupKey] !== newExpanded) {
          toggleGroup(groupKey);
        }
        group.sites.forEach((site) => {
          const siteKey = `${group.name}:${site.name}`;
          if (openGroups[siteKey] !== newExpanded) {
            toggleGroup(siteKey);
          }
        });
      });
    }, [allExpanded, cameraGroups, openGroups, toggleGroup]);

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  clearAll();
                } else {
                  selectAll();
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
            <button
              onClick={toggleAllGroups}
              className="flex items-center gap-1 py-1 text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] rounded-md transition-colors"
              title={allExpanded ? "Collapse all" : "Expand all"}
            >
              {allExpanded ? (
                <FaChevronUp size={14} />
              ) : (
                <FaChevronDown size={14} />
              )}
              {allExpanded ? "Collapse" : "Expand"}
            </button>
            {allSelectedCams.length > 0 && (
              <button
                onClick={() => {
                  clearAll();
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

          {/* ── GROUPS LIST ────────────────────────── */}
          <div className="p-2 text-sm overflow-y-auto flex-1 scrollbar-hide pb-20 md:pb-2">
            {filteredGroups.length === 0 ? (
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
              filteredGroups.map((group) => {
                const isGroupOpen = searchTerm ? true : openGroups[group.name];
                const allGroupCams = group.sites.flatMap((s) => s.cameras);
                const selectedCount = allGroupCams.filter((c) =>
                  selectedCams.includes(c),
                ).length;
                const allSelected = selectedCount === allGroupCams.length;
                const someSelected = selectedCount > 0 && !allSelected;

                return (
                  <div key={group.name} className="mb-1">
                    {/* ── GROUP HEADER ─────────────────── */}
                    <div
                      className="w-full flex items-center gap-1.5 p-2 md:p-1.5 rounded-lg bg-[var(--hover-bg)]/30 hover:bg-[var(--hover-bg)] text-[var(--text-dark)] transition-colors group cursor-pointer select-none"
                      onDoubleClick={() => handleSelectAllInGroup(group.name)}
                      title="Double-click to open all cameras"
                    >
                      <CustomCheckbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={() => {
                          if (allSelected) {
                            allGroupCams.forEach((cam) => {
                              if (selectedCams.includes(cam)) toggleCamera(cam);
                            });
                          } else {
                            selectAllInGroup(group.name);
                          }
                          if (isMobile) setShowSidebar(false);
                        }}
                        size="md"
                      />

                      <div
                        className="flex items-center gap-2 font-medium text-[15px] min-w-0 flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.name);
                        }}
                      >
                        <span className="tracking-wide truncate">
                          {highlightText(group.name, searchTerm)}
                        </span>
                        <span className="text-[10px] bg-[var(--primary-light)] text-[var(--primary-color)] px-1.5 py-1 rounded-md font-bold tabular-nums shrink-0">
                          {selectedCount}/{allGroupCams.length}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.name);
                        }}
                        className="p-1 rounded-md hover:bg-[var(--hover-bg)] focus:outline-none transition-colors shrink-0"
                        title={isGroupOpen ? "Collapse" : "Expand"}
                      >
                        <FaChevronDown
                          className={`text-[10px] text-[var(--text-muted)] transition-transform duration-300 ${isGroupOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {/* ── SITES LIST (animated) ───────── */}
                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          variants={groupExpand}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="overflow-hidden ml-3 pl-3 border-l-2 border-slate-200"
                        >
                          {group.sites.map((site, idx) => {
                            const siteKey = `${group.name}:${site.name}`;
                            const isSiteOpen = searchTerm
                              ? true
                              : openGroups[siteKey];
                            const selectedSiteCount = site.cameras.filter((c) =>
                              selectedCams.includes(c),
                            ).length;
                            const allSiteSelected =
                              selectedSiteCount === site.cameras.length;
                            const someSiteSelected =
                              selectedSiteCount > 0 && !allSiteSelected;

                            return (
                              <div key={site.name} className="relative">
                                {/* Horizontal connector line to site checkbox */}
                                <span className="absolute left-[-12px] top-[13px] w-3 h-[2px] bg-slate-200" />

                                {/* ── SITE HEADER ───────────── */}
                                <div
                                  className="w-full flex items-center gap-1.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-dark)] transition-colors cursor-pointer select-none"
                                  onDoubleClick={() => {
                                    site.cameras.forEach((cam) => {
                                      if (!selectedCams.includes(cam)) {
                                        toggleCamera(cam);
                                      }
                                    });
                                    if (isMobile) setShowSidebar(false);
                                  }}
                                  title="Double-click to open all cameras in this site"
                                >
                                  <CustomCheckbox
                                    checked={allSiteSelected}
                                    indeterminate={someSiteSelected}
                                    onChange={() => {
                                      if (allSiteSelected) {
                                        site.cameras.forEach((cam) => {
                                          if (selectedCams.includes(cam))
                                            toggleCamera(cam);
                                        });
                                      } else {
                                        site.cameras.forEach((cam) => {
                                          if (!selectedCams.includes(cam)) {
                                            toggleCamera(cam);
                                          }
                                        });
                                      }
                                      if (isMobile) setShowSidebar(false);
                                    }}
                                    size="sm"
                                  />

                                  <div
                                    className="flex items-center gap-2 font-medium text-[13px] min-w-0 flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(siteKey);
                                    }}
                                  >
                                    <span className="tracking-wide truncate">
                                      {highlightText(site.name, searchTerm)}
                                    </span>
                                    <span className="text-[9px] bg-[var(--bg-color)] text-[var(--text-muted)] px-1 py-0.5 rounded font-bold tabular-nums shrink-0">
                                      {selectedSiteCount}/{site.cameras.length}
                                    </span>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(siteKey);
                                    }}
                                    className="p-0.5 pr-2.5 rounded-md hover:bg-[var(--hover-bg)] focus:outline-none transition-colors shrink-0"
                                    title={isSiteOpen ? "Collapse" : "Expand"}
                                  >
                                    <FaChevronDown
                                      className={`text-[9px] text-[var(--text-muted)] transition-transform duration-300 ${isSiteOpen ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                </div>

                                {/* ── CAMERA LIST (animated) ───── */}
                                <AnimatePresence initial={false}>
                                  {isSiteOpen && (
                                    <motion.div
                                      variants={groupExpand}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      className="overflow-hidden ml-2 pl-2 border-l-2 border-slate-200"
                                    >
                                      {site.cameras.map((cam, camIdx) => {
                                        const isSelected =
                                          selectedCams.includes(cam);
                                        const dragging = isDragging(
                                          group.name,
                                          cam,
                                        );
                                        const dropOver = isDropOver(
                                          group.name,
                                          cam,
                                        );

                                        return (
                                          <div
                                            key={cam}
                                            className="relative mb-1 pl-0.5"
                                          >
                                            {/* Horizontal connector line to camera */}
                                            <span className="absolute left-[-3px] top-[14px] w-2 h-[2px] bg-slate-200" />

                                            <motion.div
                                              key={`${cam}-motion`}
                                              custom={camIdx}
                                              variants={itemFade}
                                              initial="hidden"
                                              animate="visible"
                                              className={`w-full flex items-center gap-2 py-1.5 pl-2.5 pr-2 rounded-lg text-lg md:text-xs transition-all border cursor-pointer
                                                ${
                                                  isSelected
                                                    ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                                                    : "bg-transparent border-transparent text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]"
                                                }
                                                ${dragging ? "opacity-40 scale-[0.97]" : ""}
                                                ${dropOver && !dragging ? "border-[var(--primary-color)] border-2 shadow-[0_0_10px_rgba(var(--primary-color-rgb,124,58,237),0.25)]" : ""}
                                              `}
                                              onClick={() => {
                                                toggleCamera(cam);
                                                if (isMobile)
                                                  setShowSidebar(false);
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
                                                  {highlightText(
                                                    cam,
                                                    searchTerm,
                                                  )}
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
                                            </motion.div>
                                          </div>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* PTZ Panel - shown at bottom when active */}
          <AnimatePresence>
            {activePTZCamera && (
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="shrink-0"
              >
                <PTZPanel cameraName={activePTZCamera} onClose={onClosePTZ} />
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </>
    );
  },
);

export default CameraSidebar;
