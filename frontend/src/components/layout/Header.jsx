import { useState, useRef, useEffect, useCallback } from "react";
import HeaderActions from "../header/HeaderActions";
import HeaderText from "../header/HeaderText";
import { FiMenu, FiMoreVertical } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_HEADER = {
  title: "",
  subtitle: "",
  logo: "",
  banner: "",
  video: "",
  mode: "normal",
  theme: "delhi-police",
};

function getHeaderConfig() {
  return { ...DEFAULT_HEADER };
}

function Header({ onMenuClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);
  const prevConfigRef = useRef("");

  const readConfig = useCallback(() => {
    return getHeaderConfig();
  }, []);

  const [headerConfig, setHeaderConfig] = useState(readConfig);

  const toggleHeaderStyle = useCallback(() => {
    setHeaderConfig((prev) => {
      const newTheme =
        prev.theme === "delhi-police" ? "generic" : "delhi-police";
      localStorage.setItem("vms_header_theme", newTheme);
      return { ...prev, theme: newTheme };
    });
  }, []);

  // Re-read config on localStorage changes (from Settings page saves)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key?.startsWith("vms_header_")) {
        setHeaderConfig(readConfig());
      }
    };

    // Also poll periodically in case storage events don't fire (same-tab writes)
    const interval = setInterval(() => {
      const config = readConfig();
      const key = JSON.stringify(config);
      if (key !== prevConfigRef.current) {
        prevConfigRef.current = key;
        setHeaderConfig(config);
      }
    }, 1000);

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [readConfig]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className="
          relative z-[50]
          shrink-0
          h-[60px] md:h-16
          px-3 md:px-6 led:px-10
          flex items-center justify-between
          bg-[var(--card-bg)] md:bg-[var(--header-bg)]
          bg-opacity-95
          border-b border-[var(--border-color)]
          backdrop-blur-md
          shadow-sm
          transition-all duration-300
        "
      >
        <div className="flex items-center shrink-0 overflow-hidden gap-1 md:gap-0 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 rounded-xl text-[var(--text-dark)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={22} />
          </button>
          <HeaderText
            theme={headerConfig.theme}
            title={headerConfig.title}
            titleColor={headerConfig.titleColor}
            subtitle={headerConfig.subtitle}
            subtitleColor={headerConfig.subtitleColor}
            logo={headerConfig.logo}
            banner={headerConfig.banner}
            video={headerConfig.video}
            mode={headerConfig.mode}
          />
        </div>

        <div className="hidden lg:flex items-center shrink-0 ml-auto gap-4 led:gap-6">
          <HeaderActions onChangeHeaderStyle={toggleHeaderStyle} />
        </div>

        <div
          className="flex lg:hidden items-center shrink-0 ml-auto"
          ref={mobileMenuRef}
        >
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors focus:outline-none cursor-pointer ${
              isMobileMenuOpen
                ? "bg-black/10 dark:bg-white/20 text-[var(--primary-color)]"
                : "text-[var(--text-dark)] hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <FiMoreVertical size={22} />
          </button>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="vms-dropdown absolute top-full right-3 mt-1 p-2 flex items-center z-[60]"
              >
                <HeaderActions
                  isMobileMode={true}
                  onChangeHeaderStyle={toggleHeaderStyle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}

export default Header;
