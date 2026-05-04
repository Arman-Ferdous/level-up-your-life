import { createContext, useContext, useEffect, useState } from "react";

const THEMES = {
  light: {
    name: "Light",
    icon: "☀️",
    vars: {
      "--bg": "#f8f9fa",
      "--bg-secondary": "#ffffff",
      "--card": "#ffffff",
      "--card-header": "#f5f5f5",
      "--text": "#1a1a2e",
      "--text-muted": "#6b7280",
      "--border": "#e5e7eb",
      "--primary": "#f5a623",
      "--primary-dark": "#f06d06",
      "--sidebar-bg": "#ffffff",
      "--sidebar-text": "#1a1a2e",
      "--input-bg": "#f9fafb",
      "--shadow": "0 2px 16px rgba(0,0,0,0.08)",
    },
  },
  dark: {
    name: "Dark",
    icon: "🌙",
    vars: {
      "--bg": "#0f0f1a",
      "--bg-secondary": "#1a1a2e",
      "--card": "#1e1e2e",
      "--card-header": "#2a2a3e",
      "--text": "#e8e8f0",
      "--text-muted": "#9ca3af",
      "--border": "#2e2e42",
      "--primary": "#f5a623",
      "--primary-dark": "#f06d06",
      "--sidebar-bg": "#1a1a2e",
      "--sidebar-text": "#e8e8f0",
      "--input-bg": "#2a2a3e",
      "--shadow": "0 2px 16px rgba(0,0,0,0.4)",
    },
  },
  midnight: {
    name: "Midnight",
    icon: "🔮",
    vars: {
      "--bg": "#0a0a1a",
      "--bg-secondary": "#12122a",
      "--card": "#16163a",
      "--card-header": "#1e1e4a",
      "--text": "#e0e0ff",
      "--text-muted": "#8888bb",
      "--border": "#2a2a5a",
      "--primary": "#7c4dff",
      "--primary-dark": "#5c35cc",
      "--sidebar-bg": "#12122a",
      "--sidebar-text": "#e0e0ff",
      "--input-bg": "#1e1e4a",
      "--shadow": "0 2px 16px rgba(124,77,255,0.2)",
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem("app-theme") || "light"
  );

  const theme = THEMES[themeKey] || THEMES.light;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem("app-theme", themeKey);
    root.setAttribute("data-theme", themeKey);
  }, [themeKey, theme]);

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, themes: THEMES, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export { THEMES };
