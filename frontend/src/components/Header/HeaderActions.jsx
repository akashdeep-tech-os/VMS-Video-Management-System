import React from "react";
import NotificationButton from "./NotificationButton";
import FullscreenButton from "./FullscreenButton";
import ThemeToggle from "../../theme/components/ThemeToggle";
import UserProfile from "./UserProfile";
import HeaderTime from "./HeaderTime";

function HeaderActions({
  isMobileMode = false,
  onChangeHeaderStyle,
}) {
  return (
    // If in mobile mode, we shrink the gap so the floating toolbar doesn't stretch off the screen
    <div className={`flex items-center ${isMobileMode ? "gap-1" : "gap-2"}`}>
      {/* Time is hidden on mobile layout usually, but we can show it if desired. 
          For mobile, keeping the toolbar compact is better, so we hide time. */}
      <div className={isMobileMode ? "hidden" : "hidden lg:block"}>
        <HeaderTime />
      </div>

      <NotificationButton />

      {/* Fullscreen doesn't work well on mobile Safari, so we hide it in mobile mode */}
      {!isMobileMode && <FullscreenButton />}

      <ThemeToggle />

      {/* User Profile avatar */}
      <UserProfile
        onChangeHeaderStyle={onChangeHeaderStyle}
        isMobileMode={isMobileMode}
      />
    </div>
  );
}

export default HeaderActions;
