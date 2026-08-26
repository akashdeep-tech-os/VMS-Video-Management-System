import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheckDouble } from "react-icons/fa";
import { AlertTriangle, AlertCircle, Info, Eye, Radio, UserX, LogOut, Minus, ChevronDown } from "lucide-react";
import { useLiveStreaming } from "../../context/LiveStreamingContext";

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" },
  warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", dot: "bg-amber-500" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", dot: "bg-blue-500" },
};

const EVENT_ICONS = {
  motion: Eye,
  face: UserX,
  intrusion: AlertTriangle,
  offline: LogOut,
  line: Minus,
  object: AlertCircle,
};

function formatTimestamp(ts) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

function EventItem({ event, onDismiss, onClickCamera }) {
  const severity = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
  const EventIcon = EVENT_ICONS[event.icon] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30, height: 0 }}
      transition={{ duration: 0.25 }}
      className={`
        relative px-3 py-2.5 border-b border-[var(--border-color)]
        hover:bg-[var(--hover-bg)] transition-colors cursor-pointer
        ${!event.read ? "bg-[var(--primary-color)]/5" : ""}
      `}
      onClick={() => onClickCamera?.(event.camera)}
    >
      <div className="flex items-start gap-2.5">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${severity.bg}`}>
          <EventIcon size={14} className={severity.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="text-[11px] font-semibold text-[var(--text-dark)] truncate">{event.label}</h4>
            {!event.read && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
            )}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] truncate">{event.camera}</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{formatTimestamp(event.timestamp)}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.(event.id);
          }}
          className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors"
          title="Mark as read"
        >
          <FaTimes size={10} />
        </button>
      </div>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${severity.dot} ${!event.read ? "opacity-100" : "opacity-0"}`} />
    </motion.div>
  );
}

export default function EventPanel({ onClickCamera }) {
  const {
    showEventPanel,
    setShowEventPanel,
    filteredEvents,
    eventFilter,
    setEventFilter,
    unreadEventCount,
    dismissEvent,
    clearAllEvents,
  } = useLiveStreaming();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filters = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "critical", label: "Critical" },
    { key: "warning", label: "Warning" },
    { key: "info", label: "Info" },
  ];

  // Mobile: bottom sheet with collapsed/expanded states
  if (isMobile) {
    return (
      <AnimatePresence>
        {showEventPanel && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: mobileExpanded ? 0 : "calc(100% - 52px)" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-t border-[var(--border-color)] rounded-t-2xl shadow-2xl"
            style={{ maxHeight: mobileExpanded ? "70vh" : "52px" }}
          >
            {/* Drag Handle */}
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="w-full flex flex-col items-center py-2 touch-manipulation"
            >
              <div className="w-8 h-1 rounded-full bg-[var(--border-color)] mb-1.5" />
              <div className="flex items-center gap-2">
                <Radio size={12} className="text-[var(--primary-color)]" />
                <span className="text-[11px] font-bold text-[var(--text-dark)]">Live Events</span>
                {unreadEventCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-red-500 text-white rounded-full">
                    {unreadEventCount > 99 ? "99+" : unreadEventCount}
                  </span>
                )}
                <ChevronDown size={12} className={`text-[var(--text-muted)] transition-transform ${mobileExpanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Expanded Content */}
            {mobileExpanded && (
              <div className="flex flex-col" style={{ maxHeight: "calc(70vh - 52px)" }}>
                {/* Filter Tabs */}
                <div className="px-3 py-1.5 border-t border-[var(--border-color)] flex items-center gap-1 overflow-x-auto shrink-0">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setEventFilter(f.key)}
                      className={`px-2 py-0.5 text-[9px] font-semibold rounded-md transition-all whitespace-nowrap ${
                        eventFilter === f.key
                          ? "bg-[var(--primary-color)] text-white"
                          : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Events List */}
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(70vh - 100px)" }}>
                  {filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-[var(--text-muted)]">
                      <Info size={20} className="mb-1 opacity-40" />
                      <p className="text-[10px] font-medium">No events</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filteredEvents.map((event) => (
                        <EventItem
                          key={event.id}
                          event={event}
                          onDismiss={dismissEvent}
                          onClickCamera={(cam) => {
                            onClickCamera?.(cam);
                            setMobileExpanded(false);
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-1.5 border-t border-[var(--border-color)] flex items-center justify-between text-[8px] text-[var(--text-muted)] shrink-0">
                  <span>{filteredEvents.length} events</span>
                  <span>{unreadEventCount} unread</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: side panel
  return (
    <AnimatePresence>
      {showEventPanel && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="h-full border-l border-[var(--border-color)] bg-[var(--card-bg)] flex flex-col shrink-0 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-[var(--primary-color)]" />
              <h3 className="text-[13px] font-bold text-[var(--text-dark)]">Live Events</h3>
              {unreadEventCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
                  {unreadEventCount > 99 ? "99+" : unreadEventCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadEventCount > 0 && (
                <button
                  onClick={clearAllEvents}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)] transition-colors"
                  title="Mark all as read"
                >
                  <FaCheckDouble size={12} />
                </button>
              )}
              <button
                onClick={() => setShowEventPanel(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-dark)] transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center gap-1 overflow-x-auto shrink-0">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setEventFilter(f.key)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  eventFilter === f.key
                    ? "bg-[var(--primary-color)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
                <Info size={24} className="mb-2 opacity-40" />
                <p className="text-[11px] font-medium">No events</p>
                <p className="text-[10px] opacity-60">Events will appear here in real-time</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onDismiss={dismissEvent}
                    onClickCamera={onClickCamera}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-4 py-2 border-t border-[var(--border-color)] flex items-center justify-between text-[9px] text-[var(--text-muted)] shrink-0">
            <span>{filteredEvents.length} events</span>
            <span>{unreadEventCount} unread</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
