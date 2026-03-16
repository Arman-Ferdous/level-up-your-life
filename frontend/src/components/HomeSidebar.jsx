import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import UpcomingTasksSidebar from "./UpcomingTasksSidebar";
import styles from "./HomeSidebar.module.css";

const MOOD_LABELS = {
  "😄": "Great",
  "🙂": "Good",
  "😐": "Okay",
  "😔": "Low",
  "😢": "Sad",
  "😡": "Angry",
  "😰": "Anxious",
  "🤩": "Excited",
  "😴": "Tired",
  "🤒": "Sick",
};

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HomeSidebar() {
  const [todayMood, setTodayMood] = useState(null);
  const [moodLoading, setMoodLoading] = useState(true);

  useEffect(() => {
    const date = getTodayLocalDate();
    api
      .get("/api/mood/today", { params: { date } })
      .then((res) => setTodayMood(res.data.entry))
      .catch(() => setTodayMood(null))
      .finally(() => setMoodLoading(false));
  }, []);

  const moodLabel = todayMood ? (MOOD_LABELS[todayMood.emoji] ?? "Noted") : null;

  return (
    <div className={styles.sidebar}>
      {/* ── Mood Bubble ── */}
      <div className={styles.moodCard}>
        {moodLoading ? (
          <span className={styles.moodPlaceholder}>…</span>
        ) : todayMood ? (
          <>
            <span className={styles.moodEmoji}>{todayMood.emoji}</span>
            <p className={styles.moodLabel}>Today: {moodLabel}</p>
            {todayMood.note && (
              <p className={styles.moodNote}>"{todayMood.note}"</p>
            )}
          </>
        ) : (
          <>
            <span className={styles.moodEmojiEmpty}>🫥</span>
            <p className={styles.moodLabel}>No mood logged</p>
            <Link to="/mood" className={styles.moodCta}>
              Log mood →
            </Link>
          </>
        )}
      </div>

      {/* ── Upcoming Tasks ── */}
      <UpcomingTasksSidebar />
    </div>
  );
}
