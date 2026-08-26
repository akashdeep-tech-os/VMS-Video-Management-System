import { createContext, useContext, useState, useEffect, useCallback } from "react";
import "./styles.css";

const GlassThemeContext = createContext(null);

function getDeptTheme() {
  try {
    // Use the active department for theme (set only by Switch Department)
    const raw = localStorage.getItem("vms_active_department");
    if (!raw) return null;
    const dept = JSON.parse(raw);
    if (!dept?.theme) return null;
    return dept.theme;
  } catch {
    return null;
  }
}

function getDeptGlassTheme() {
  const deptTheme = getDeptTheme();
  // Only use department theme if glassTheme was explicitly set
  if (deptTheme && typeof deptTheme.glassTheme === "boolean" && deptTheme.hasOwnProperty("glassTheme")) {
    return deptTheme.glassTheme;
  }
  // No department or no theme set — use global setting, default to false (simple theme)
  return localStorage.getItem("glass_theme") === "true";
}

export function GlassThemeProvider({ children }) {
  const [isGlassTheme, setIsGlassTheme] = useState(() => getDeptGlassTheme());

  // Apply glass theme to body
  useEffect(() => {
    if (isGlassTheme) {
      document.body.classList.add("glass-theme");
    } else {
      document.body.classList.remove("glass-theme");
    }
  }, [isGlassTheme]);

  // Listen for department changes (from Settings page save or department switch)
  useEffect(() => {
    const checkDeptTheme = () => {
      const deptGlass = getDeptGlassTheme();
      setIsGlassTheme(deptGlass);
    };

    // Poll for same-tab changes (Settings save, department switch) — skip when
    // the tab is hidden to avoid waking the render cycle on background pages.
    const interval = setInterval(() => {
      if (!document.hidden) checkDeptTheme();
    }, 1000);

    // Also listen for cross-tab storage events
    const handleStorage = (e) => {
      if (e.key === "vms_active_department" || e.key === "vms_departments") {
        checkDeptTheme();
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
