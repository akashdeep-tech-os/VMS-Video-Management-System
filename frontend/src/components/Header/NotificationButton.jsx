import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaCheck, FaTrash } from "react-icons/fa";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Wifi,
  Camera,
  Clock,
  ChevronRight,
  X,
} from "lucide-react";
import { alerts as mockAlerts } from "../dashboard/mockData";

// Notification type configuration
const NOTIFICATION_CONFIG = {
  Critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    badgeColor: "bg-red-500",
  },
  Warning: {
    icon: AlertCircle,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeColor: "bg-amber-500",
  },
  Information: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    badgeColor: "bg-blue-500",
  },
};

// Transform alerts into notifications
const transformAlertsToNotifications = (alertsList) => {
  return alertsList.map((alert) => ({
    id: alert.id,
    title: alert.title,
    message: alert.description,
    location: alert.location,
    severity: alert.severity,
    time: alert.time,
    timestamp: Date.now() - parseTimeToMs(alert.time),
    read: false,
    type: getNotificationType(alert.title),
  }));
};

// Parse time string to milliseconds
function parseTimeToMs(timeStr) {
  const match = timeStr.match(/(\d+)\s*(min|hr|hour|day)/i);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "min") return value * 60 * 1000;
  if (unit === "hr" || unit === "hour") return value * 60 * 60 * 1000;
  if (unit === "day") return value * 24 * 60 * 60 * 1000;
  return 0;
}

// Determine notification type based on title
function getNotificationType(title) {
  const lower = title.toLowerCase();
  if (lower.includes("camera") || lower.includes("ptz")) return "camera";
  if (lower.includes("access") || lower.includes("face") || lower.includes("unauthorized"))
    return "security";
  if (lower.includes("bandwidth") || lower.includes("network")) return "network";
  if (lower.includes("storage")) return "storage";
  if (lower.includes("power") || lower.includes("ups")) return "power";
  if (lower.includes("update") || lower.includes("system")) return "system";
  return "general";
}

// Get icon based on notification type
function getNotificationIcon(type) {
  switch (type) {
    case "camera":
      return Camera;
    case "security":
      return Shield;
    case "network":
      return Wifi;
    case "storage":
      return AlertCircle;
    case "power":
      return AlertTriangle;
    case "system":
      return Info;
    default:
      return Bell;
  }
}

// Format relative time
function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() =>
    transformAlertsToNotifications(mockAlerts)
  );
  const [filter, setFilter] = useState("all"); // all, unread, critical, warning, info
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter(
    (n) => !n.read && n.severity === "Critical"
  ).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "critical") return n.severity === "Critical";
    if (filter === "warning") return n.severity === "Warning";
    if (filter === "info") return n.severity === "Information";
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        ref={buttonRef}
        whileTap={{ scale: 0.92 }}
        onClick={toggleDropdown}
        aria-label={`Notifications, ${unreadCount} unread`}
        title="Alerts & Notifications"
        className={`
          relative p-2 sm:p-2.5 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          transition-all duration-300
          ${
            isOpen
              ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)]"
              : "hover:bg-[var(--hover-bg)] text-[var(--text-dark)]"
          }
        `}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
        >
          <FaBell className="text-[15px]" />
        </motion.div>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`
                absolute -top-1 -right-1
                min-w-[18px] h-[18px] px-1
                flex items-center justify-center
                rounded-full
                ${criticalCount > 0 ? "bg-red-500" : "bg-[var(--primary-color)]"}
                text-white
                text-[10px] font-semibold
                shadow-[0_0_8px_rgba(239,68,68,0.6)]
              `}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="
              absolute top-full mt-2
              right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2
              w-[320px] sm:w-[360px] max-w-[calc(100vw-1rem)]
              bg-[var(--card-bg)] border border-[var(--border-color)]
              rounded-xl sm:rounded-2xl shadow-2xl
              overflow-hidden
              z-[100]
            "
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-dark)]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1 text-[11px] font-medium text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition-colors cursor-pointer"
                      title="Mark all as read"
                    >
                      <FaCheck size={11} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-0.5 overflow-x-auto">
                {[
                  { key: "all", label: "All" },
                  { key: "unread", label: "Unread" },
                  { key: "critical", label: "Critical" },
                  { key: "warning", label: "Warning" },
                  { key: "info", label: "Info" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`
                      px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-md
                      transition-all duration-200 whitespace-nowrap cursor-pointer
                      ${
                        filter === tab.key
                          ? "bg-[var(--primary-color)] text-white"
                          : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[280px] sm:max-h-[340px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[var(--hover-bg)] flex items-center justify-center">
                    <FaBell className="text-[var(--text-muted)] text-sm" />
                  </div>
                  <p className="text-xs font-medium text-[var(--text-dark)]">
                    No notifications
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {filter === "all"
                      ? "You're all caught up!"
                      : `No ${filter} notifications`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {filteredNotifications.map((notification) => {
                    const config = NOTIFICATION_CONFIG[notification.severity];
                    const TypeIcon = getNotificationIcon(notification.type);
                    const SeverityIcon = config.icon;

                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`
                          group relative px-3 py-2 cursor-pointer
                          transition-colors duration-200
                          ${
                            !notification.read
                              ? "bg-[var(--primary-color)]/5 hover:bg-[var(--primary-color)]/10"
                              : "hover:bg-[var(--hover-bg)]"
                          }
                        `}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2">
                          {/* Icon */}
                          <div
                            className={`
                              flex-shrink-0 w-7 h-7 rounded-lg
                              flex items-center justify-center
                              ${config.bgColor}
                            `}
                          >
                            <SeverityIcon
                              size={13}
                              className={config.color}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4
                                className={`
                                  text-[11px] sm:text-[12px] font-medium truncate
                                  ${
                                    !notification.read
                                      ? "text-[var(--text-dark)]"
                                      : "text-[var(--text-muted)]"
                                  }
                                `}
                              >
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
                              )}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] line-clamp-1 mb-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-[var(--text-muted)]">
                              <span className="flex items-center gap-0.5">
                                <Clock size={9} />
                                {formatRelativeTime(notification.timestamp)}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <TypeIcon size={9} />
                                {notification.location}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Delete"
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Severity Indicator */}
                        <div
                          className={`
                            absolute left-0 top-0 bottom-0 w-0.5
                            ${config.badgeColor}
                            ${
                              !notification.read ? "opacity-100" : "opacity-0"
                            }
                            transition-opacity duration-200
                          `}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-3 py-2 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={clearAll}
                    className="text-[10px] sm:text-[11px] font-medium text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-medium text-[var(--primary-color)] hover:underline cursor-pointer"
                  >
                    View all alerts
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationButton;
