import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Camera, Play, MoreHorizontal,
  Settings, Info, Grid3X3, BarChart3, Monitor,
  Car, CarFront, ScanFace, Minus, Crosshair,
  Users, FileBarChart,
} from "lucide-react";

const spring = { type: "spring", stiffness: 500, damping: 35 };
const popSpring = { type: "spring", stiffness: 400, damping: 30 };

const navGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    children: null,
  },
  {
    id: "video",
    label: "Video",
    icon: Camera,
    title: "Video Management",
    children: [
      { label: "Live Monitoring", icon: Camera, path: "/live" },
      { label: "Playback", icon: Play, path: "/playback" },
      { label: "Reports", icon: BarChart3, path: "/reports" },
    ],
  },
  {
    id: "anpr",
    label: "ANPR",
    icon: Car,
    title: "ANPR System",
    children: [
      { label: "ANPR Dashboard", icon: Grid3X3, path: "/anpr-dashboard" },
      { label: "Vehicle Tracking", icon: CarFront, path: "/tracking" },
      { label: "Blacklist Vehicles", icon: Monitor, path: "/blacklist-vehicles" },
      { label: "ANPR Reports", icon: FileBarChart, path: "/anpr-reports" },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: ScanFace,
    title: "AI Analytics",
    children: [
      { label: "Face Recognition", icon: ScanFace, path: "/face" },
      { label: "People Counting", icon: Users, path: "/people" },
      { label: "Line Crossing", icon: Minus, path: "/line-crossing" },
      { label: "Object Detection", icon: Crosshair, path: "/object-detection" },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: MoreHorizontal,
    title: "Other",
    children: [
      { label: "Settings", icon: Settings, path: "/settings" },
      { label: "About", icon: Info, path: "/about" },
    ],
  },
];

function PillNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPopover, setOpenPopover] = useState(null);
  const popoverRef = useRef(null);
  const triggerRefs = useRef({});

  const currentPath = location.pathname;

  const isActive = useCallback((path) => currentPath === path, [currentPath]);

  const isGroupActive = useCallback((group) => {
    if (group.path && isActive(group.path)) return true;
    if (group.children) return group.children.some((c) => isActive(c.path));
    return false;
  }, [isActive]);

  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        const isTrigger = Object.values(triggerRefs.current).some((ref) =>
          ref && ref.contains(e.target)
        );
        if (!isTrigger) setOpenPopover(null);
      }
    };
    if (openPopover) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openPopover]);

  useEffect(() => {
    setOpenPopover(null);
  }, [currentPath]);

  const handleGroupClick = (group) => {
    if (!group.children) {
      navigate(group.path);
      return;
    }
    setOpenPopover((prev) => (prev === group.id ? null : group.id));
  };

  const handleChildClick = (path) => {
    navigate(path);
    setOpenPopover(null);
  };

  const activeGroup = navGroups.find(isGroupActive);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[100] select-none pointer-events-none pb-[calc(4px+env(safe-area-inset-bottom,0px))] flex justify-center">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
          className="flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-2 rounded-[28px] sm:rounded-[32px] bg-white/85 dark:bg-black/65 backdrop-blur-[40px] saturate-[180%] border border-white/60 dark:border-white/15 shadow-[0_12px_48px_rgba(0,0,0,0.15),0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.55),0_4px_16px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] pointer-events-auto mx-3"
        >
          {navGroups.map((group) => {
            const Icon = group.icon;
            const active = isGroupActive(group);
            return (
              <div key={group.id} className="relative">
                <motion.button
                  ref={(el) => { triggerRefs.current[group.id] = el; }}
                  onClick={() => handleGroupClick(group)}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 min-h-[36px] sm:min-h-0 py-1.5 sm:py-2.5 rounded-[18px] sm:rounded-[22px] text-[11px] sm:text-[13px] font-semibold transition-colors duration-200 cursor-pointer outline-none
                    ${active
                      ? "text-white"
                      : "text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/90 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="pill-active-bg"
                      className="absolute inset-0 rounded-[18px] sm:rounded-[22px] bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_4px_16px_rgba(79,70,229,0.35),0_2px_6px_rgba(79,70,229,0.25)]"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2.5">
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                    <span className="hidden sm:block tracking-wide">
                      {group.label}
                    </span>
                  </span>
                  {active && group.children && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] z-20"
                    />
                  )}
                </motion.button>
              </div>
            );
          })}
        </motion.div>
      </nav>

      <AnimatePresence>
        {openPopover && (() => {
          const group = navGroups.find((g) => g.id === openPopover);
          if (!group || !group.children) return null;
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[90]"
                onClick={() => setOpenPopover(null)}
              />
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: 20, scale: 0.92, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, scale: 0.92, filter: "blur(8px)" }}
                transition={{ ...popSpring, filter: { duration: 0.2 } }}
                className="fixed z-[95] rounded-[24px] bg-white/85 dark:bg-black/65 backdrop-blur-[40px] saturate-[180%] border border-white/50 dark:border-white/15 shadow-[0_12px_48px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] p-2 min-w-[200px] sm:min-w-[220px] overflow-hidden bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2"
              >
                <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-white/35 px-4 py-2.5 sm:py-2.5">
                  {group.title || group.label}
                </div>
                <div className="relative pl-4">
                  {group.children.map((child, i) => {
                    const ChildIcon = child.icon;
                    const active = isActive(child.path);
                    const isLast = i === group.children.length - 1;
                    return (
                      <div key={child.path} className="relative">
                        <span
                          className={`absolute left-0 top-0 w-[1.5px] bg-gradient-to-b from-blue-400/40 via-indigo-400/30 to-transparent pointer-events-none ${
                            isLast ? "h-1/2" : "h-full"
                          }`}
                        />
                        <span className="absolute left-0 top-1/2 w-2.5 h-[1.5px] bg-gradient-to-r from-blue-400/40 to-transparent pointer-events-none -translate-y-[0.75px]" />
                        <motion.button
                          onClick={() => handleChildClick(child.path)}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-3 w-full pl-5 pr-4 min-h-[44px] sm:min-h-0 py-2.5 sm:py-2.5 rounded-2xl text-[13px] font-medium transition-colors duration-200 cursor-pointer outline-none
                            ${active
                              ? "text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
                              : "text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                            }`}
                        >
                          <ChildIcon size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                          <span className="flex-1 text-left">{child.label}</span>
                          {active && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                            />
                          )}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </>
  );
}

export default PillNavbar;
