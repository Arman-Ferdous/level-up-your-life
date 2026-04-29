import { useState, useContext, useEffect } from "react";
import styles from "./MoodHexPicker.module.css";
import { MoodAPI } from "../api/mood.api";
import { MoodContext } from "../context/MoodContext";
import { MOODS } from "../constants/moods";

export default function MoodHexPicker({ initial, onSaved }) {
  const moodCtx = useContext(MoodContext);
  const fetchHistory = moodCtx?.fetchHistory;
  const [selected, setSelected] = useState(initial?.emoji ?? null);
  const [loadingId, setLoadingId] = useState(null);
  const [collapsed, setCollapsed] = useState(Boolean(initial));

  useEffect(() => {
    // if initial changes, reflect it
    setSelected(initial?.emoji ?? null);
    setCollapsed(Boolean(initial));
  }, [initial]);

  const handlePick = async (mood) => {
    if (loadingId) return;
    setSelected(mood.emoji);
    setLoadingId(mood.id);

    try {
      const today = new Date();
      const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

      const payload = { date, emoji: mood.emoji };
      const res = await MoodAPI.saveMood(payload);
      if (onSaved) onSaved(res.data.entry);
      // refresh global mood history so Mood Journal sees the change
      try { fetchHistory(); } catch (e) { /* ignore */ }
      // collapse the radial picker to center showing selected
      setCollapsed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const radius = 84; // px

  return (
    <div className={`${styles.hexWrap} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.circle}>
        {MOODS.map((m, i) => {
          const angle = (i / MOODS.length) * 360;
          const style = {
            transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
          };

          return (
            <button
              key={m.id}
              className={`${styles.moodBtn} ${selected === m.emoji ? styles.selected : ""}`}
              style={style}
              onClick={() => handlePick(m)}
              aria-pressed={selected === m.emoji}
            >
              <span className={styles.emoji} aria-hidden="true">{m.emoji}</span>
              <span className={styles.label}>{m.label}</span>
            </button>
          );
        })}

        <div className={styles.centerBadge} aria-hidden="true">{selected ?? "🙂"}</div>
      </div>
    </div>
  );
}
