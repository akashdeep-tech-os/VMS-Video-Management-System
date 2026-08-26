import { useClassicTheme } from "../classic/ClassicThemeProvider";

export const usePalette = () => {
    const { isDarkMode } = useClassicTheme();

    return {
        accent: {
            main: isDarkMode ? "#0972afff" : "#8B5CF6",
            hover: isDarkMode ? "#67e8f9" : "#7c3aed",
            muted: isDarkMode ? "rgba(34,211,238,0.15)" : "rgba(139,92,246,0.10)",
            border: isDarkMode ? "rgba(34,211,238,0.25)" : "rgba(139,92,246,0.20)",
            text: isDarkMode ? "#cffafe" : "#5b21b6",
        },

        surface: {
            base: isDarkMode ? "#0d1117" : "#f9fafb",
            layout: isDarkMode ? "#0d1117" : "#f9fafb",
            main: isDarkMode ? "#0d1117" : "#ffffff",
            card: isDarkMode ? "#111827" : "#ffffff",
            raised: isDarkMode ? "#161d2e" : "#f8fafc",
            hover: isDarkMode ? "#1c2638" : "#f1f5f9",
            border: isDarkMode ? "#1e2433" : "#e5e7eb",
        },

        text: {
            main: isDarkMode ? "#f1f5f9" : "#111827",
            secondary: isDarkMode ? "#94a3b8" : "#4b5563",
            muted: isDarkMode ? "#64748b" : "#9ca3af",
        },

        shadow: isDarkMode
            ? "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)"
            : "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)",

        transition: "transition-all duration-100 ease-in-out",

        isDark: isDarkMode,
    };
};
