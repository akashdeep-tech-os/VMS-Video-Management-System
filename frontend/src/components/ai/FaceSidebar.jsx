import React, { useState, useMemo, useRef } from "react";
import {
  FaChevronDown,
  FaSearch,
  FaTimes,
  FaGripVertical,
} from "react-icons/fa";
import { FiFolder, FiFolderMinus, FiVideo } from "react-icons/fi";
import { MdOutlineVideocamOff } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

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

const FaceSidebar = React.memo(
  ({
    isMobile,
    showSidebar,
    setShowSidebar,
    cameraGroups,
    openGroups,
    toggleGroup,
    onSelectCamera,
    selectedCamera,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

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
                cam.toLowerCase().includes(lower)
              ),
            }))
            .filter(
              (site) =>
                site.name.toLowerCase().includes(lower) ||
                site.cameras.length > 0
            ),
        }))
        .filter(
          (group) =>
            group.name.toLowerCase().includes(lower) ||
            group.sites.length > 0
        );
    }, [cameraGroups, searchTerm]);

    const selectFirstInGroup = (groupName) => {
      const group = cameraGroups.find((g) => g.name === groupName);
      if (!group) return;
      const allCams = group.sites.flatMap((s) => s.cameras);
      if (allCams.length > 0) {
        onSelectCamera(allCams[0]);
      }
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

          {/* Groups List */}
          <div className="p-2 text-sm overflow-y-auto flex-1 scrollbar-hide pb-20 md:pb-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60 h-32 mt-10">
                <MdOutlineVideocamOff size={36} className="mb-3 opacity-40" />
                <span className="text-sm font-medium">No cameras found</span>
                <span className="text-[10px] mt-1 opacity-70">
                  Try a different search term
                </span>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isGroupOpen = searchTerm ? true : openGroups[group.name];
                const allGroupCams = group.sites.flatMap((s) => s.cameras);
                const hasSelected = allGroupCams.some((c) => selectedCamera === c);

                return (
                  <div key={group.name} className="mb-1">
                    {/* Group Header */}
                    <div
                      className="w-full flex items-center gap-1.5 p-2 md:p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-dark)] transition-colors group cursor-pointer select-none"
                      onDoubleClick={() => selectFirstInGroup(group.name)}
                      title="Double-click to select first camera"
                    >
                      <div
                        className="flex items-center gap-2 font-semibold text-[13px] min-w-0 flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.name);
                        }}
                      >
                        {isGroupOpen ? (
                          <FiFolderMinus
                            className="text-[var(--primary-color)] shrink-0"
                            size={16}
                          />
                        ) : (
                          <FiFolder
                            className="text-[var(--text-muted)] group-hover:text-[var(--primary-color)] transition-colors shrink-0"
                            size={16}
                          />
                        )}
                        <span className="tracking-wide truncate">{group.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums shrink-0 bg-[var(--primary-light)] text-[var(--primary-color)]">
                          {allGroupCams.length}
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

                    {/* Sites List */}
                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          variants={groupExpand}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="overflow-hidden pl-4 mt-0.5"
                        >
                          {group.sites.map((site) => {
                            const siteKey = `${group.name}:${site.name}`;
                            const isSiteOpen = searchTerm ? true : openGroups[siteKey];
                            const hasSiteSelected = site.cameras.some((c) => selectedCamera === c);

                            return (
                              <div key={site.name} className="mb-0.5">
                                {/* Site Header */}
                                <div
                                  className="w-full flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-dark)] transition-colors group/site cursor-pointer select-none"
                                  onDoubleClick={() => {
                                    if (site.cameras.length > 0) {
                                      onSelectCamera(site.cameras[0]);
                                    }
                                  }}
                                  title="Double-click to select first camera in this site"
                                >
                                  <div
                                    className="flex items-center gap-2 font-medium text-[12px] min-w-0 flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(siteKey);
                                    }}
                                  >
                                    {isSiteOpen ? (
                                      <FiFolderMinus
                                        className="text-[var(--primary-color)]/70 shrink-0"
                                        size={14}
                                      />
                                    ) : (
                                      <FiFolder
                                        className="text-[var(--text-muted)]/70 group-hover/site:text-[var(--primary-color)] transition-colors shrink-0"
                                        size={14}
                                      />
                                    )}
                                    <span className="tracking-wide truncate">{site.name}</span>
                                    <span className="text-[9px] bg-[var(--bg-color)] text-[var(--text-muted)] px-1 py-0.5 rounded font-bold tabular-nums shrink-0">
                                      {site.cameras.length}
                                    </span>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(siteKey);
                                    }}
                                    className="p-0.5 rounded-md hover:bg-[var(--hover-bg)] focus:outline-none transition-colors shrink-0"
                                    title={isSiteOpen ? "Collapse" : "Expand"}
                                  >
                                    <FaChevronDown
                                      className={`text-[9px] text-[var(--text-muted)] transition-transform duration-300 ${isSiteOpen ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                </div>

                                {/* Camera List */}
                                <AnimatePresence initial={false}>
                                  {isSiteOpen && (
                                    <motion.div
                                      variants={groupExpand}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      className="overflow-hidden pl-5 mt-0.5"
                                    >
                                      {site.cameras.map((cam, camIdx) => {
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
        </aside>
      </>
    );
  }
);

export default FaceSidebar;
