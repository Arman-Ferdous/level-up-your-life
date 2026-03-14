import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import styles from "./Home.module.css";

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const { user } = useAuth();
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

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || user.name;
  const moodLabel = todayMood ? (MOOD_LABELS[todayMood.emoji] ?? "Noted") : null;

  return (
    <main className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.greeting}>{getGreeting()},</p>
          <h1 className={styles.name}>{firstName} 👋</h1>
          <p className={styles.sub}>
            Here's your daily overview. Keep leveling up!
          </p>
        </div>

        {/* Today's mood bubble */}
        <div className={styles.moodBubble}>
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
              <p className={styles.moodLabel}>No mood logged yet</p>
              <Link to="/mood" className={styles.moodCta}>
                Log today's mood →
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className={styles.cards}>
        <Link to="/mood" className={styles.card}>
          <span className={styles.cardIcon}>🧠</span>
          <h3 className={styles.cardTitle}>Mood Tracker</h3>
          <p className={styles.cardDesc}>Log how you feel and review your 7-day mood history.</p>
        </Link>

        <Link to="/expense-tracker" className={styles.card}>
          <span className={styles.cardIcon}>💰</span>
          <h3 className={styles.cardTitle}>Expense Tracker</h3>
          <p className={styles.cardDesc}>Track income and expenses with charts and monthly summaries.</p>
        </Link>
      </section>
    </main>
  );
}