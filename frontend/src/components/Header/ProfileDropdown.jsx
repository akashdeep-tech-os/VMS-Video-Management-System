import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaSignInAlt,
  FaBars,
} from "react-icons/fa";
import { currentDisplayName, currentRole, roleLabel } from "../../api/userService";

function ProfileDropdown({
  isProfileOpen,
  onClose,
  isMobileMode,
  onChangeHeaderStyle,
}) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("vms_token"));
  const displayName = currentDisplayName() || "User";
  const displayRole = roleLabel(currentRole());

  useEffect(() => {
    const sync = () => setIsLoggedIn(!!localStorage.getItem("vms_token"));

    const handleStorage = (e) => {
      if (e.key === "vms_token") sync();
    };
    window.addEventListener("storage", handleStorage);

    const interval = setInterval(sync, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("vms_token");
    localStorage.removeItem("vms_user");
    setIsLoggedIn(false);
    onClose();
    navigate("/");
  };

  return (
    <AnimatePresence>
      {isProfileOpen && (
        <motion.div
          key="profile-menu"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          // ✅ If in mobile mode, push it slightly further down so it doesn't overlap the 3-dot menu
          className={`absolute right-0 w-[280px] max-w-[calc(100vw-2rem)] origin-top-right rounded-3xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[99999] ${
            isMobileMode ? "top-[125%] -right-2" : "top-[110%] mt-2"
          }`}
        >
          {/* TOP HEADER */}
          <div className="p-4 border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-dark)] leading-tight">
                  {displayName}
                </h3>
                {displayRole && (
                  <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                    {displayRole}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* MENU ITEMS */}
          <div className="p-2 flex flex-col gap-1">
            {/* LOGIN / LOGOUT */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <FaSignOutAlt className="text-base" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
              >
                <FaSignInAlt className="text-base" />
                <span>Login</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProfileDropdown;
