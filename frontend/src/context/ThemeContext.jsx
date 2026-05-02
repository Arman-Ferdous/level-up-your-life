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
  forest: {
    name: "Forest",
    icon: "🌿",
    vars: {
      "--bg": "#f0f7f0",
      "--bg-secondary": "#ffffff",
      "--card": "#ffffff",
      "--card-header": "#e8f5e9",
      "--text": "#1b3a1f",
      "--text-muted": "#557a5a",
      "--border": "#c8e6c9",
      "--primary": "#4caf50",
      "--primary-dark": "#2e7d32",
      "--sidebar-bg": "#e8f5e9",
      "--sidebar-text": "#1b3a1f",
      "--input-bg": "#f1f8f1",
      "--shadow": "0 2px 16px rgba(46,125,50,0.1)",
    },
  },
  ocean: {
    name: "Ocean",
    icon: "🌊",
    vars: {
      "--bg": "#e8f4fd",
      "--bg-secondary": "#ffffff",
      "--card": "#ffffff",
      "--card-header": "#e3f2fd",
      "--text": "#0d2137",
      "--text-muted": "#4a7a9b",
      "--border": "#bbdefb",
      "--primary": "#1976d2",
      "--primary-dark": "#0d47a1",
      "--sidebar-bg": "#e3f2fd",
      "--sidebar-text": "#0d2137",
      "--input-bg": "#f0f8ff",
      "--shadow": "0 2px 16px rgba(25,118,210,0.1)",
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
  rose: {
    name: "Rose",
    icon: "🌸",
    vars: {
      "--bg": "#fff5f7",
      "--bg-secondary": "#ffffff",
      "--card": "#ffffff",
      "--card-header": "#fce4ec",
      "--text": "#3d0a1a",
      "--text-muted": "#9c4d6a",
      "--border": "#f8bbd0",
      "--primary": "#e91e63",
      "--primary-dark": "#c2185b",
      "--sidebar-bg": "#fce4ec",
      "--sidebar-text": "#3d0a1a",
      "--input-bg": "#fff0f3",
      "--shadow": "0 2px 16px rgba(233,30,99,0.1)",
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
    // Set data-theme for any CSS selectors
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
