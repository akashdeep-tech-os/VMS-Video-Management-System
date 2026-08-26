import { createContext, useContext, useState, useEffect } from "react";

const ClassicThemeContext = createContext(null);

export function ClassicThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ClassicThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ClassicThemeContext.Provider>
  );
}

export function useClassicTheme() {
  const ctx = useContext(ClassicThemeContext);
  if (!ctx) throw new Error("useClassicTheme must be used within a ClassicThemeProvider");
  return ctx;
}
