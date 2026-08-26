import { useState, useMemo, useEffect, useRef } from "react";
import { FaChevronDown, FaSearch, FaTimes } from "react-icons/fa";
import { FiVideo } from "react-icons/fi";
import { MdOutlineVideocamOff } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayback } from "../../Context/PlaybackContext";

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

function LeftPanel({ collapsed, isMobile, onClose }) {
  const {
    cameraGroups,
    selectedCameras,
    setSelectedCameras,
    searchDate,
    setSearchDate,
    searchStartTime,
    setSearchStartTime,
    searchEndTime,
    setSearchEndTime,
    searchStartPeriod,
    setSearchStartPeriod,
    searchEndPeriod,
    setSearchEndPeriod,
    searchRecordings,
  } = usePlayback();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target))
        setOpenMonth(false);
      if (yearRef.current && !yearRef.current.contains(e.target))
        setOpenYear(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setOpenCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayHeaders = ["S", "M", "T", "W", "T", "F", "S"];

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [calMonth, calYear]);

  const handleTimeBlur = (value, setter) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) {
      setter("");
      return;
    }
    let formatted;
    if (digits.length <= 2) {
      const h = digits.padStart(2, "0");
      formatted = `${h}:00`;
    } else {
      const h = digits.slice(0, 2).padStart(2, "0");
      const m = digits.slice(2, 4).padEnd(2, "0").slice(0, 2);
      formatted = `${h}:${m}`;
    }
    const hNum = parseInt(formatted.split(":")[0], 10);
    if (hNum > 12) formatted = "12" + formatted.slice(2);
    const mNum = parseInt(formatted.split(":")[1], 10);
    if (mNum > 59) formatted = formatted.split(":")[0] + ":59";
    setter(formatted);
  };

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
  }, [searchTerm, cameraGroups]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCamera = (cam) => {
    // Only one camera at a time
    setSelectedCameras((prev) => (prev.includes(cam) ? [] : [cam]));
  };

  if (collapsed) return null;

  return (
    <div className="h-full bg-[var(--card-bg)] text-[var(--text-dark)] border-r border-[var(--border-color)] flex flex-col shrink-0 relative">
      {/* Purple ambient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[var(--primary-color)]/[0.06] to-transparent pointer-events-none" />

      {/* ── HEADER ──────────────────────────────── */}
      <div className="px-3 py-2.5 md:px-4 md:py-0 md:h-12 border-b border-[var(--border-color)] flex-shrink-0 relative flex items-center gap-2">
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--danger)] hover:text-white transition-colors text-[var(--text-muted)] shrink-0"
          >
            <FaTimes size={14} />
          </button>
        )}

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

      {/* GROUPS LIST (SCROLLABLE) */}
      <div className="p-2 text-lg overflow-y-auto flex-1 scrollbar-hide pb-20 md:pb-2">
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-[var(--text-muted)] opacity-80 h-32 mt-10">
            <MdOutlineVideocamOff size={36} className="mb-3 " />
            <span className="text-lg font-medium">No cameras found</span>
            <span className="text-[13px] mt-1">
              Try a different search term
            </span>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isGroupOpen = searchTerm ? true : openGroups[group.name];

            return (
              <div key={group.name} className="mb-1">
                {/* GROUP HEADER */}
                <div className="w-full flex items-center gap-1.5 p-2 md:p-1.5 rounded-lg bg-[var(--hover-bg)]/30 hover:bg-[var(--hover-bg)] text-[var(--text-dark)] transition-colors group cursor-pointer select-none">
                  <div
                    className="flex items-center gap-2 font-semibold text-[15px] min-w-0 flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(group.name);
                    }}
                  >
                    <span className="tracking-wide truncate">{group.name}</span>
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

                {/* SITES LIST */}
                <AnimatePresence initial={false}>
                  {isGroupOpen && (
                    <motion.div
                      variants={groupExpand}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="overflow-hidden ml-4 pl-3 border-l-2 border-slate-200"
                    >
                      {group.sites.map((site) => {
                        const siteKey = `${group.name}:${site.name}`;
                        const isSiteOpen = searchTerm
                          ? true
                          : openGroups[siteKey];

                        return (
                          <div key={site.name}>
                            {/* SITE HEADER */}
                            <div
                              className="w-full flex items-center gap-1.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-dark)] transition-colors cursor-pointer select-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(siteKey);
                              }}
                            >
                              <span className="tracking-wide truncate text-[12px] font-medium">
                                {site.name}
                              </span>

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

                            {/* CAMERA LIST */}
                            <AnimatePresence initial={false}>
                              {isSiteOpen && (
                                <motion.div
                                  variants={groupExpand}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  className="overflow-hidden ml-4 pl-3 border-l-2 border-slate-200"
                                >
                                  {site.cameras.map((cam) => {
                                    const isSelected =
                                      selectedCameras.includes(cam);

                                    return (
                                      <motion.div
                                        key={cam}
                                        variants={itemFade}
                                        initial="hidden"
                                        animate="visible"
                                        className={`w-full flex items-center gap-2 py-1.5 pr-2 rounded-lg text-sm md:text-xs transition-all border cursor-pointer
                                          ${
                                            isSelected
                                              ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                                              : "bg-transparent border-transparent text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]"
                                          }
                                        `}
                                        onClick={() => {
                                          toggleCamera(cam);
                                          if (isMobile) onClose?.();
                                        }}
                                      >
                                        <FiVideo
                                          className={`text-[15px] shrink-0 transition-colors ${
                                            isSelected
                                              ? "text-white"
                                              : "text-[var(--primary-color)]/60"
                                          }`}
                                        />

                                        <div className="flex flex-col text-left overflow-hidden w-full">
                                          <span className="truncate font-semibold tracking-wide leading-tight">
                                            {cam}
                                          </span>
                                        </div>

                                        {/* Camera status indicator */}
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            isSelected
                                              ? "bg-white"
                                              : "bg-emerald-500"
                                          }`}
                                          title="Online"
                                        />
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

      {/* DATE & TIME PICKERS */}
      <div className="px-2.5 pt-2 pb-2 border-t border-[var(--border-color)]">
        {/* Date Picker Button + Popover */}
        <div ref={calendarRef} className="relative mb-2">
          <label className="text-[13px] text-[var(--text-dark)] block mb-0.5 font-medium">
            Select Date
          </label>
          <button
            onClick={() => setOpenCalendar(!openCalendar)}
            className="w-full flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-dark)] text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:border-[var(--primary-color)] transition cursor-pointer"
          >
            <span>
              {monthNames[calMonth]} {selectedDate}, {calYear}
            </span>
            <FaChevronDown
              size={10}
              className={`text-[var(--text-muted)] transition-transform ${openCalendar ? "rotate-180" : ""}`}
            />
          </button>

          {openCalendar && (
            <div className="vms-dropdown absolute bottom-full left-0 mb-1 w-full z-50 p-2">
              {/* Month & Year Selectors */}
              <div className="flex items-center gap-1.5 mb-2">
                {/* Month Dropdown */}
                <div ref={monthRef} className="flex-1 relative">
                  <button
                    onClick={() => {
                      setOpenMonth(!openMonth);
                      setOpenYear(false);
                    }}
                    className="w-full flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-dark)] text-[12px] font-semibold px-2 py-1 rounded hover:border-[var(--primary-color)] transition cursor-pointer"
                  >
                    <span>{monthNames[calMonth]}</span>
                    <FaChevronDown
                      size={10}
                      className="text-[var(--text-muted)]"
                    />
                  </button>
                  {openMonth && (
                    <div className="vms-dropdown absolute top-full left-0 mt-1 w-full z-50 max-h-40 overflow-y-auto">
                      {monthNames.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setCalMonth(i);
                            setOpenMonth(false);
                          }}
                          className={`w-full text-left px-2 py-1 text-[12px] hover:bg-[var(--hover-bg)] transition ${
                            calMonth === i
                              ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-bold"
                              : "text-[var(--text-dark)]"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Year Dropdown */}
                <div ref={yearRef} className="relative">
                  <button
                    onClick={() => {
                      setOpenYear(!openYear);
                      setOpenMonth(false);
                    }}
                    className="w-16 flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-dark)] text-[12px] font-semibold px-2 py-1 rounded hover:border-[var(--primary-color)] transition cursor-pointer"
                  >
                    <span>{calYear}</span>
                    <FaChevronDown
                      size={10}
                      className="text-[var(--text-muted)]"
                    />
                  </button>
                  {openYear && (
                    <div className="vms-dropdown absolute top-full right-0 mt-1 w-20 z-50 max-h-40 overflow-y-auto">
                      {Array.from(
                        { length: 21 },
                        (_, i) => today.getFullYear() - 10 + i,
                      ).map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            setCalYear(y);
                            setOpenYear(false);
                          }}
                          className={`w-full text-left px-2 py-1 text-[10px] hover:bg-[var(--hover-bg)] transition ${
                            calYear === y
                              ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-bold"
                              : "text-[var(--text-dark)]"
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center">
                {dayHeaders.map((d, i) => (
                  <span
                    key={i}
                    className={`text-[12px] font-bold py-0.5 ${
                      i === 0 || i === 6
                        ? "text-red-500"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Date Grid */}
              <div className="grid grid-cols-7 text-center px-1 pb-1 -mt-0.5">
                {Array.from({
                  length: new Date(calYear, calMonth, 1).getDay(),
                }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarDays.map((day) => {
                  const isToday =
                    calMonth === today.getMonth() &&
                    calYear === today.getFullYear() &&
                    day === today.getDate();
                  const isSelected = day === selectedDate;
                  const dayOfWeek = new Date(calYear, calMonth, day).getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDate(day);
                        setOpenCalendar(false);
                      }}
                      className={`text-[12px] w-6 h-6 flex items-center justify-center rounded-full transition mx-auto
                        ${isToday ? "bg-[var(--primary-color)] text-white font-bold shadow-sm" : "cursor-pointer hover:bg-[var(--hover-bg)]"}
                        ${isSelected && !isToday ? "bg-[var(--primary-color)]/15 text-[var(--primary-color)] font-bold" : ""}
                        ${!isToday && !isSelected && isWeekend ? "text-red-500" : ""}
                        ${!isToday && !isSelected && !isWeekend ? "text-[var(--text-dark)]" : ""}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* TIME PICKERS */}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <label className="text-[12px] text-[var(--text-dark)] block mb-0.5 font-medium">
              Start Time
            </label>
            <div className="flex items-center gap-0.5">
              <input
                type="text"
                value={searchStartTime}
                onChange={(e) => setSearchStartTime(e.target.value)}
                onBlur={() =>
                  handleTimeBlur(searchStartTime, setSearchStartTime)
                }
                placeholder="--:--"
                maxLength={5}
                className="flex-1 min-w-0 bg-[var(--card-bg)] border border-[var(--border-color)] px-1.5 py-0.5 rounded text-[11px] text-[var(--text-dark)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary-color)]"
              />
              <div className="flex rounded overflow-hidden border border-[var(--border-color)] shrink-0">
                <button
                  onClick={() => setSearchStartPeriod("AM")}
                  className={`text-[11px] font-bold px-1 py-0.5 transition ${
                    searchStartPeriod === "AM"
                      ? "bg-[var(--primary-color)] text-white"
                      : "bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  AM
                </button>
                <button
                  onClick={() => setSearchStartPeriod("PM")}
                  className={`text-[11px] font-bold px-1 py-0.5 transition border-l border-[var(--border-color)] ${
                    searchStartPeriod === "PM"
                      ? "bg-[var(--primary-color)] text-white"
                      : "bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[12px] text-[var(--text-dark)] block mb-0.5 font-medium">
              End Time
            </label>
            <div className="flex items-center gap-0.5">
              <input
                type="text"
                value={searchEndTime}
                onChange={(e) => setSearchEndTime(e.target.value)}
                onBlur={() => handleTimeBlur(searchEndTime, setSearchEndTime)}
                placeholder="--:--"
                maxLength={5}
                className="flex-1 min-w-0 bg-[var(--card-bg)] border border-[var(--border-color)] px-1.5 py-0.5 rounded text-[11px] text-[var(--text-dark)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary-color)]"
              />
              <div className="flex rounded overflow-hidden border border-[var(--border-color)] shrink-0">
                <button
                  onClick={() => setSearchEndPeriod("AM")}
                  className={`text-[11px] font-bold px-1 py-0.5 transition ${
                    searchEndPeriod === "AM"
                      ? "bg-[var(--primary-color)] text-white"
                      : "bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  AM
                </button>
                <button
                  onClick={() => setSearchEndPeriod("PM")}
                  className={`text-[11px] font-bold px-1 py-0.5 transition border-l border-[var(--border-color)] ${
                    searchEndPeriod === "PM"
                      ? "bg-[var(--primary-color)] text-white"
                      : "bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="px-2.5 pb-2.5">
        <button
          onClick={() => {
            const date = new Date(calYear, calMonth, selectedDate);
            setSearchDate(date);
            searchRecordings(date);
          }}
          className="w-full bg-[var(--primary-color)] hover:opacity-90 text-white py-1.5 rounded-lg text-[13px] font-semibold transition shadow-sm"
        >
          Search Recording
        </button>
      </div>
    </div>
  );
}

export default LeftPanel;
