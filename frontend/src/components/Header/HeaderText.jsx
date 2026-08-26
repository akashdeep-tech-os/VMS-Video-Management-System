import React from "react";
import { motion } from "framer-motion";

const styles = `
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-gradient {
    animation: gradientShift 4s ease infinite;
  }
`;

function HeaderText({
  theme = "delhi-police",
  title = "",
  subtitle = "",
  tagline = "",
  logo = "",
  banner = "",
  video = "",
  mode = "normal",
  titleColor = "",
  subtitleColor = "",
}) {
  // Background Video Mode - video or banner behind logo + text with overlay
  if (mode === "background" && (video || banner)) {
    return (
      <div className="flex items-center gap-2.5 md:gap-4 pl-1 md:pl-3 select-none relative rounded-xl overflow-hidden h-full flex-1 min-w-0">
        <style>{styles}</style>
        {video ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={video}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : banner ? (
          <img
            src={banner}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* Logo */}
        {logo ? (
          <motion.img
            src={logo}
            alt=""
            className="w-10 h-10 md:w-12 md:h-12 shrink-0 relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}

        <div className="flex flex-col min-w-0 flex-1 relative z-10">
          <motion.h1
            className="text-[14px] sm:text-[18px] md:text-[22px] led:text-[26px] font-extrabold tracking-wide leading-none truncate text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02 }}
            style={titleColor ? { color: titleColor } : undefined}
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.h2
              className="text-[9px] sm:text-[11px] md:text-[13px] font-semibold tracking-widest mt-0.5 truncate text-white/70"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              {subtitle}
            </motion.h2>
          )}
        </div>
      </div>
    );
  }

  // Festival Mode - video or banner alongside logo + text
  if (mode === "festival" && (video || banner)) {
    return (
      <div className="flex items-center gap-2 md:gap-3 select-none overflow-hidden flex-1 min-w-0">
        <style>{styles}</style>
        {/* Logo */}
        {logo ? (
          <motion.img
            src={logo}
            alt=""
            className="w-8 h-8 md:w-10 md:h-10 shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
        {/* Text */}
        <div className="flex flex-col min-w-0 shrink-0 max-w-[180px] md:max-w-[240px]">
          <motion.h1
            className="text-[14px] sm:text-[16px] md:text-[20px] led:text-[24px] font-black tracking-tighter leading-none truncate"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ color: titleColor || undefined }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.h2
              className="text-[10px] md:text-[12px] font-semibold tracking-widest mt-0.5 truncate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
              style={{ color: subtitleColor || "var(--text-muted)" }}
            >
              {subtitle}
            </motion.h2>
          )}
        </div>
        {/* Media */}
        {video ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-9 md:h-11 rounded-lg object-cover flex-1 min-w-0"
            src={video}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : banner ? (
          <img
            src={banner}
            alt=""
            className="h-9 md:h-11 rounded-lg object-cover flex-1 min-w-0"
          />
        ) : null}
      </div>
    );
  }

  if (theme === "generic") {
    return (
      <div className="flex items-center gap-3 pl-1 md:pl-3 select-none">
        <style>{styles}</style>
        {banner && (
          <div className="hidden md:block h-10 w-32 rounded-lg overflow-hidden shrink-0">
            <img src={banner} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <motion.h1
          className="text-[15px] sm:text-[17px] md:text-[22px] led:text-[25px] font-bold tracking-widest text-[var(--text-dark)] select-none"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="hidden sm:inline">Welcome To </span>
          {title}
        </motion.h1>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 md:gap-4 pl-1 md:pl-3 select-none relative rounded-xl overflow-hidden"
      style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
    >
      <style>{styles}</style>

      {/* Banner Overlay */}
      {banner && (
        <div className="absolute inset-0 bg-black/50 z-0"></div>
      )}

      {/* Logo */}
      {logo ? (
        <motion.img
          src={logo}
          alt=""
          className="w-10 h-10 md:w-12 md:h-12 shrink-0 relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}

      <div className="flex flex-col min-w-0 flex-1 relative z-10">
        <motion.h1
          className={`text-[14px] sm:text-[18px] md:text-[22px] led:text-[26px] font-extrabold tracking-wide leading-none truncate ${
            !titleColor && !banner
              ? "bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient"
              : banner
                ? "text-white"
                : ""
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.02 }}
          style={titleColor ? { color: titleColor } : undefined}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.h2
            className={`text-[9px] sm:text-[11px] md:text-[13px] font-semibold tracking-widest mt-0.5 truncate ${
              banner ? "text-white/70" : ""
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ color: subtitleColor || (banner ? "rgba(255,255,255,0.7)" : undefined) }}
          >
            {subtitle}
          </motion.h2>
        )}
      </div>
    </div>
  );
}

export default HeaderText;
