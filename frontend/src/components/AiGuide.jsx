import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiAPI } from "../api/ai.api";
import { useAuth } from "../context/AuthContext";
import styles from "./AiGuide.module.css";

function getMoodPayload(todayMood) {
  if (!todayMood) return {};

  return {
    moodEmoji: todayMood.emoji || "",
    moodLabel: todayMood.note || todayMood.label || "",
    moodTag: todayMood.tag || ""
  };
}

export default function AiGuide({ todayMood = null, surface = "home", compact = false }) {
  const { user } = useAuth();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGuide() {
      setLoading(true);
      setError("");

      try {
        const response = await AiAPI.getGuide({
          surface,
          ...getMoodPayload(todayMood)
        });

        if (!active) return;
        setGuide(response.data.guide || null);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Could not load AI guide");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (user) {
      loadGuide();
    } else {
      setLoading(false);
      setGuide(null);
    }

    return () => {
      active = false;
    };
  }, [surface, todayMood, user]);

  const handleSuggestionClick = (suggestion) => {
    AiAPI.trackAction({
      surface,
      eventType: "click",
      suggestionKey: suggestion.key,
      suggestionLabel: suggestion.label,
      destination: suggestion.href || "",
      metadata: {
        compact,
        moodEmoji: todayMood?.emoji || "",
        moodLabel: todayMood?.note || ""
      }
    }).catch(() => {});
  };

  if (!user) return null;

  const suggestions = (guide?.suggestions || []).slice(0, compact ? 2 : 4);

  return (
    <section
      className={`${styles.card} ${compact ? styles.compact : ""} ${styles[`surface_${surface}`] || ""}`}
      aria-label="AI Guide"
    >
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{guide?.headline || "AI Guide"}</h3>
          {!compact && <p className={styles.sub}>Motivation and next steps tailored to your day</p>}
        </div>
        <span className={styles.badge}>AI</span>
      </div>

      <div className={styles.body}>
        {loading ? (
          <p className={styles.message}>Finding the right nudge...</p>
        ) : error ? (
          <p className={styles.message}>{error}</p>
        ) : (
          <p className={styles.message}>{guide?.message || "Keep going. Small wins still count."}</p>
        )}

        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion.key}
                to={suggestion.href}
                onClick={() => handleSuggestionClick(suggestion)}
                className={compact ? styles.suggestionCompact : styles.suggestionCard}
              >
                <span className={styles.suggestionLabel}>{suggestion.label}</span>
                {!compact && <span className={styles.suggestionDescription}>{suggestion.description}</span>}
              </Link>
            ))}
          </div>
        )}

        {!compact && (
          <div className={styles.footer}>
            <small>LevelUp learns from what you click and will keep adjusting the nudges.</small>
          </div>
        )}
      </div>
    </section>
  );
}