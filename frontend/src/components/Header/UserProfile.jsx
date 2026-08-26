import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaChevronDown, FaUserCircle } from "react-icons/fa";
import ProfileDropdown from "./ProfileDropdown";
import { currentDisplayName, currentRole, roleLabel } from "../../api/userService";

function UserProfile({
  isMobileMode = false,
  onChangeHeaderStyle,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const displayName = currentDisplayName() || "User";
  const displayRole = roleLabel(currentRole());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <div className="relative z-[9999]" ref={profileRef}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        role="button"
        aria-haspopup="true"
        aria-expanded={isProfileOpen}
        className={`flex items-center gap-2 cursor-pointer transition-all duration-300 rounded-2xl border
          ${isMobileMode ? "p-1" : "pl-2 pr-3 py-1.5 ml-1"}
          ${
            isProfileOpen
              ? "bg-[var(--hover-bg)] border-[var(--border-color)]"
              : "border-transparent hover:border-[var(--border-color)] hover:bg-[var(--hover-bg)]"
          }
        `}
      >
        {isMobileMode ? (
          <FaUserCircle className="text-[20px] text-[var(--text-dark)]" />
        ) : (
          <div className="hidden sm:flex flex-col leading-tight select-none">
            <span className="text-sm font-semibold text-[var(--text-dark)]">
              {displayName}
            </span>
            {displayRole && (
              <span className="text-xs text-[var(--text-muted)]">
                {displayRole}
              </span>
            )}
          </div>
        )}

        {!isMobileMode && (
          <FaChevronDown
            className={`text-[11px] ml-1 text-[var(--text-muted)] transition-transform duration-300 ${
              isProfileOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </motion.div>

      <ProfileDropdown
        isProfileOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isMobileMode={isMobileMode}
        onChangeHeaderStyle={onChangeHeaderStyle}
      />
    </div>
  );
}

export default UserProfile;
