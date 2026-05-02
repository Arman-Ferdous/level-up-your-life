import { useTheme } from "../context/ThemeContext";
import "./ThemeSelectionPage.css";

export default function ThemeSelectionPage() {
  const { themeKey, setThemeKey, themes } = useTheme();

  return (
    <div className="ts-page">
      <div className="ts-hero">
        <h1 className="ts-title">🎨 Theme Selection</h1>
        <p className="ts-subtitle">
          Personalize your experience. Pick a theme that matches your vibe.
        </p>
      </div>

      <div className="ts-grid">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            className={`ts-card ${themeKey === key ? "ts-card--active" : ""}`}
            onClick={() => setThemeKey(key)}
            style={{
              "--card-bg": theme.vars["--card"],
              "--card-text": theme.vars["--text"],
              "--card-muted": theme.vars["--text-muted"],
              "--card-border": theme.vars["--border"],
              "--card-primary": theme.vars["--primary"],
              "--card-bg-main": theme.vars["--bg"],
            }}
          >
            {/* Mini preview */}
            <div
              className="ts-preview"
              style={{ background: theme.vars["--bg"] }}
            >
              <div
                className="ts-preview-sidebar"
                style={{ background: theme.vars["--sidebar-bg"] }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="ts-preview-item"
                    style={{ background: theme.vars["--border"] }}
                  />
                ))}
              </div>
              <div className="ts-preview-main">
                <div
                  className="ts-preview-card"
                  style={{
                    background: theme.vars["--card"],
                    borderColor: theme.vars["--border"],
                  }}
                >
                  <div
                    className="ts-preview-bar ts-preview-bar--primary"
                    style={{ background: theme.vars["--primary"] }}
                  />
                  <div
                    className="ts-preview-bar"
                    style={{ background: theme.vars["--border"] }}
                  />
                  <div
                    className="ts-preview-bar ts-preview-bar--short"
                    style={{ background: theme.vars["--border"] }}
                  />
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="ts-label">
              <span className="ts-icon">{theme.icon}</span>
              <span className="ts-name">{theme.name}</span>
              {themeKey === key && (
                <span className="ts-check">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="ts-current">
        <p>
          Currently using:{" "}
          <strong>
            {themes[themeKey].icon} {themes[themeKey].name}
          </strong>
        </p>
      </div>
    </div>
  );
}
