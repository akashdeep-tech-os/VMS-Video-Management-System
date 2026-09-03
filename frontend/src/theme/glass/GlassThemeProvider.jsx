import { createContext, useContext, useState, useEffect, useCallback } from "react";
import "./styles.css";

const GlassThemeContext = createContext(null);

function getGlassTheme() {
  return localStorage.getItem("glass_theme") === "true";
}

export function GlassThemeProvider({ children }) {
  const [isGlassTheme, setIsGlassTheme] = useState(() => getGlassTheme());

  // Apply glass theme to body
  useEffect(() => {
    if (isGlassTheme) {
      document.body.classList.add("glass-theme");
    } else {
      document.body.classList.remove("glass-theme");
    }
  }, [isGlassTheme]);

  // Listen for glass theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsGlassTheme(getGlassTheme());
    };

    // Poll for same-tab changes
    const interval = setInterval(() => {
      if (!document.hidden) checkTheme();
    }, 1000);

    // Also listen for cross-tab storage events
    const handleStorage = (e) => {
      if (e.key === "glass_theme") {
        checkTheme();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleGlassTheme = useCallback(() => {
    setIsGlassTheme((prev) => !prev);
  }, []);

  return (
    <GlassThemeContext.Provider value={{ isGlassTheme, toggleGlassTheme }}>
      {children}
    </GlassThemeContext.Provider>
  );
}

export function useGlassTheme() {
  const ctx = useContext(GlassThemeContext);
  if (!ctx) throw new Error("useGlassTheme must be used within GlassThemeProvider");
  return ctx;
}
