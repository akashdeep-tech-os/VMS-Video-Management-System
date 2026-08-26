import { motion, AnimatePresence } from "framer-motion";
import { FaMoon, FaSun } from "react-icons/fa";
import { useDarkMode } from "../classic/useDarkMode";

function ThemeToggle() {
  const [isDarkMode, toggleTheme] = useDarkMode();

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="
        relative flex items-center justify-center
        w-9 h-9 rounded-xl
        hover:bg-[var(--hover-bg)]
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        transition-all duration-300
        overflow-hidden
      "
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDarkMode ? (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="absolute flex items-center justify-center"
          >
            <FaSun className="text-yellow-400 text-[16px]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
            className="absolute flex items-center justify-center"
          >
            <FaMoon className="text-[16px] text-[var(--icon-color)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default ThemeToggle;
