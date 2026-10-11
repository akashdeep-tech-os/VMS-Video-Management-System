import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { HiOutlineBars3, HiOutlineBars3BottomLeft } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

import MenuSection from "../common/MenuSection";
import { sidebarConfig } from "./sidebarConfig";
import { currentRole } from "../../api/userService";
import logo from "../../assets/logo-new.png";

const sidebarSpring = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
};

const contentFade = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: -6,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

const sectionLabelFade = {
  hidden: { opacity: 0, x: -6 },
  visible: (index = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.03 + index * 0.012,
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: { opacity: 0, x: -4, transition: { duration: 0.1 } },
};

const Sidebar = ({ mobileOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [openMenu, setOpenMenu] = useState({
    video: true,
    ai: true,
    anpr: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => location.pathname === path;

  // Role gating: an entry with `roles: [...]` only shows for those roles
  // (Settings is Admin-only in the two-role system).
  const role = currentRole();
  const hasRole = (item) => !item.roles || item.roles.includes(role);

  const filteredConfig = sidebarConfig
    .filter(hasRole)
    .filter(
      (section) => !(section.type === "single" && section.name === "Dashboard"),
    )
    .map((section) => {
      if (section.type === "single") {
        return section.name.toLowerCase().includes(searchQuery.toLowerCase())
          ? section
          : null;
      }
      if (!section.children) return null;
      const filteredChildren = section.children.filter(
        (item) =>
          hasRole(item) &&
          item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (
        filteredChildren.length > 0 ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return { ...section, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean);

  const dashboardItem = sidebarConfig.find(
    (s) => s.type === "single" && s.name === "Dashboard",
  );
  const isDashboardActive = dashboardItem && isActive(dashboardItem.path);

  // When mobile sidebar overlay is open, show full width; otherwise honor collapsed state
  const effectivelyCollapsed = isMobile && mobileOpen ? false : isCollapsed;
  const sidebarWidth = effectivelyCollapsed ? 72 : 280;

  // On mobile, sidebar is hidden unless mobileOpen is true
  const isVisible = !isMobile || mobileOpen;
  const mobileHidden = isMobile && !mobileOpen;

  return (
    <motion.aside
      animate={{
        width: mobileHidden ? 0 : sidebarWidth,
      }}
      transition={sidebarSpring}
      className={`will-change-width
        h-screen
        bg-[#0c1222]
        border-r border-white/5
        shadow-[4px_0_30px_rgba(0,0,0,0.4)]
        flex flex-col
        z-50
        overflow-hidden
        shrink-0
        ${isMobile ? "fixed left-0 top-0" : "relative"}
        ${mobileHidden ? "pointer-events-none" : ""}
      `}
    >
      {/* Purple ambient glow at top */}
      <motion.div
        animate={{
          opacity: effectivelyCollapsed ? 0.45 : 1,
          scaleX: effectivelyCollapsed ? 0.8 : 1,
        }}
        transition={sidebarSpring}
        className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-600/8 to-transparent pointer-events-none origin-left"
      />

      {/* ── HEADER ─────────────────────────────────── */}
      <motion.div
        transition={sidebarSpring}
        className={`relative z-10 min-h-sidebar-header ${
          effectivelyCollapsed
            ? "flex flex-col items-center py-3 gap-3"
            : "flex items-center justify-between px-4 py-3"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center overflow-hidden ${
            effectivelyCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ">
            <img
              src={logo}
              alt="Surakshit VMS"
              className="w-full h-full object-contain"
            />
          </div>

          <AnimatePresence initial={false}>
            {!effectivelyCollapsed && (
              <motion.div
                variants={contentFade}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-w-0"
              >
                <p className="text-white text-sm font-bold tracking-widest">
                  SURAKSHIT VMS
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (isMobile && mobileOpen) {
              onClose?.();
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          aria-label={
            effectivelyCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          className="
      w-9 h-9
      flex items-center justify-center
      rounded-xl
      bg-white/5
      hover:bg-blue-500/20
      text-gray-200
      hover:text-blue-300
      transition-all duration-300
      shrink-0
    "
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={effectivelyCollapsed ? "expand" : "collapse"}
              initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {effectivelyCollapsed ? (
                <HiOutlineBars3 size={20} />
              ) : (
                <HiOutlineBars3BottomLeft size={20} />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* ── SEARCH ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!effectivelyCollapsed && (
          <motion.div
            variants={contentFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 px-4 pb-3"
          >
            <motion.div
              transition={sidebarSpring}
              className={`flex items-center gap-2 rounded-xl transition-all duration-300 border
      px-3 py-2.5
      ${
        searchFocused
          ? "bg-[#0a0f1e] border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.2)]"
          : "bg-white/5 border-white/5 hover:border-white/10"
      }`}
            >
              <FaSearch
                size={13}
                className={`shrink-0 ${
                  searchFocused ? "text-blue-400" : "text-gray-500"
                }`}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Quick search..."
                className="bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none w-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DIVIDER ────────────────────────────────── */}
      <div className="mx-3 mb-2 border-t border-white/5" />

      {/* ── DASHBOARD (FIXED) ─────────────────────── */}
      {dashboardItem && (
        <div
          className={`${effectivelyCollapsed ? "px-1.5" : "px-2.5"} shrink-0`}
        >
          <ul className="list-none m-0 p-0">
            <li
              title={effectivelyCollapsed ? dashboardItem.name : ""}
              onClick={() => {
                navigate(dashboardItem.path);
                if (isMobile) onClose?.();
              }}
              className={`group relative flex items-center cursor-pointer rounded-xl transition-all duration-200
                ${effectivelyCollapsed ? "justify-center p-2.5 my-0.5" : "gap-3 px-3 min-h-[44px] md:py-2.5 my-0.5"}
                ${
                  isDashboardActive
                    ? "bg-blue-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)]"
                    : "text-gray-300 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <dashboardItem.icon
                  size={effectivelyCollapsed ? 20 : 18}
                  className={`shrink-0 transition-colors ${
                    isDashboardActive
                      ? "text-white"
                      : "group-hover:text-blue-400"
                }`}
              />
              <AnimatePresence initial={false}>
                {!effectivelyCollapsed && (
                  <motion.span
                    variants={sectionLabelFade}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="text-sm font-semibold tracking-wide whitespace-nowrap"
                  >
                    {dashboardItem.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {isDashboardActive && !effectivelyCollapsed && (
                <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-white rounded-r-full" />
              )}
              {isDashboardActive && effectivelyCollapsed && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </li>
          </ul>
        </div>
      )}

      {/* ── DIVIDER ────────────────────────────────── */}
      <div className="mx-3 my-1 border-t border-white/5" />

      {/* ── NAV (SCROLLABLE) ───────────────────────── */}
      <nav
        className={`flex-1 overflow-y-auto sidebar-scroll relative z-10 ${
          effectivelyCollapsed ? "px-1.5 py-1" : "px-2.5 py-1"
        }`}
      >
        {filteredConfig.map((section, index) => {
          const SectionIcon = section.icon;

          // ── SINGLE ITEM (Settings) ──────────────
          if (section.type === "single") {
            const active = isActive(section.path);
            return (
              <div key={section.name}>
                {index > 0 && (
                  <div
                    className={`border-t border-white/[0.04] ${effectivelyCollapsed ? "mx-1 my-1.5" : "mx-2 my-2"}`}
                  />
                )}
                <ul className="list-none m-0 p-0">
                  <li
                    title={effectivelyCollapsed ? section.name : ""}
                    onClick={() => {
                      navigate(section.path);
                      if (isMobile) onClose?.();
                    }}
                    className={`group relative flex items-center cursor-pointer rounded-xl transition-all duration-200
                      ${effectivelyCollapsed ? "justify-center p-2.5 my-0.5" : "gap-3 px-3 min-h-[44px] md:py-2.5 my-0.5"}
                      ${
                        active
                          ? "bg-blue-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)]"
                          : "text-gray-300 hover:bg-white/5 hover:text-gray-200"
                      }`}
                    >
                      <SectionIcon
                        size={effectivelyCollapsed ? 20 : 18}
                        className={`shrink-0 transition-colors ${
                          active ? "text-white" : "group-hover:text-blue-400"
                      }`}
                    />
                    <AnimatePresence initial={false}>
                      {!effectivelyCollapsed && (
                        <motion.span
                          custom={index}
                          variants={sectionLabelFade}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="text-sm font-semibold tracking-wide whitespace-nowrap"
                        >
                          {section.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {active && !effectivelyCollapsed && (
                      <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-white rounded-r-full" />
                    )}
                    {active && effectivelyCollapsed && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                    )}
                  </li>
                </ul>
              </div>
            );
          }

          // ── GROUP ITEM ───────────────────────────
          return (
            <div key={section.key}>
              {index > 0 && (
                <div
                  className={`border-t border-white/[0.04] ${effectivelyCollapsed ? "mx-1 my-1.5" : "mx-2 my-2"}`}
                />
              )}
              <MenuSection
                icon={<SectionIcon size={effectivelyCollapsed ? 20 : 18} />}
                title={section.title}
                isOpen={openMenu[section.key]}
                toggle={() => toggleMenu(section.key)}
                collapsed={effectivelyCollapsed}
                isMobile={isMobile}
              >
                {section.children.map((item, i) => {
                  const ItemIcon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li
                      key={i}
                      title={effectivelyCollapsed ? item.name : ""}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) onClose?.();
                      }}
                      className={`group relative flex items-center cursor-pointer rounded-lg transition-all duration-200
                        ${effectivelyCollapsed ? "justify-center p-2.5 my-1" : "gap-3 px-3 min-h-[44px] md:py-2.5 my-1"}
                        ${
                          active
                            ? "bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-sm"
                            : "text-gray-300 hover:bg-white/5 hover:text-gray-200"
                        }`}
                      >
                        <ItemIcon
                          size={effectivelyCollapsed ? 16 : 14}
                          className={`shrink-0 transition-colors ${
                            active
                              ? "text-blue-300"
                              : "group-hover:text-blue-400"
                        }`}
                      />
                      <AnimatePresence initial={false}>
                        {!effectivelyCollapsed && (
                          <motion.div
                            custom={index + i}
                            variants={sectionLabelFade}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex items-center justify-between w-full min-w-0"
                          >
                            <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2 shrink-0
                              ${
                                item.badge.class === "badge-danger"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : item.badge.class === "badge-success"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : item.badge.class === "badge-warning"
                                      ? "bg-yellow-400/20 text-yellow-300 border border-yellow-500/30"
                                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                              >
                                {item.badge.text}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {active && !effectivelyCollapsed && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      )}
                      {active && effectivelyCollapsed && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                      )}
                    </li>
                  );
                })}
              </MenuSection>
            </div>
          );
        })}
      </nav>

      {/* ── FOOTER ─────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/5">
        <AnimatePresence mode="wait" initial={false}>
          {effectivelyCollapsed ? (
            /* Collapsed footer - status dot only */
            <motion.div
              key="collapsed-footer"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center py-3"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </motion.div>
          ) : (
            /* Expanded footer */
            <motion.div
              key="expanded-footer"
              variants={contentFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="px-4 py-3 flex items-center justify-between"
            >
              <span className="text-[11px] text-gray-600 font-medium">
                VMS v2.4.0
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-green-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Secure
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
