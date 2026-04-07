import { useState, useEffect, useContext } from "react";
import { api } from "../api/axios";
import { MoodContext } from "../context/MoodContext";
import styles from "./MoodPicker.module.css";

const EMOJIS = ["😄", "🙂", "😐", "😔", "😡", "😴"];

// Get today's date in local timezone as YYYY-MM-DD
function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEarliestAllowedDate() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTargetDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const monthName = date.toLocaleDateString(undefined, { month: "short" });
  return `${weekday}, ${monthName} ${day}`;
}

export default function MoodPicker() {
  const { fetchHistory } = useContext(MoodContext);
  const todayDate = getTodayLocalDate();
  const earliestAllowedDate = getEarliestAllowedDate();

  const [targetDate, setTargetDate] = useState(todayDate);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMoodByDate() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/mood/today", { params: { date: targetDate } });

        if (!isMounted) {
          return;
        }

        if (res.data.entry) {
          setSelected(res.data.entry.emoji);
          setNote(res.data.entry.note ?? "");
          setSaved(true);
        } else {
          setSelected(null);
          setNote("");
          setSaved(false);
        }
      } catch (e) {
        if (isMounted) {
          setError(e?.response?.data?.message ?? "Failed to load selected day's mood.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMoodByDate();

    return () => {
      isMounted = false;
    };
  }, [targetDate]);

  async function handleSave() {
    if (!selected) return;
    setError(null);
    try {
      setSaving(true);
      const timestamp = new Date().toISOString();
      await api.post("/api/mood", { 
        emoji: selected, 
        note, 
        date: targetDate,
        timestamp 
      });
      setSaved(true);
      // Refresh history in parent after saving
      fetchHistory();
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to save mood.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={styles.status}>Loading...</p>;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Update Your Mood</h2>

      <div className={styles.dateCard}>
        <label htmlFor="mood-date" className={styles.dateLabel}>Log mood for</label>
        <input
          id="mood-date"
          type="date"
          value={targetDate}
          min={earliestAllowedDate}
          max={todayDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className={styles.dateInput}
        />
        <p className={styles.dateHint}>
          Editing: <strong>{formatTargetDate(targetDate)}</strong> (last 30 days only)
        </p>
      </div>

      <div className={styles.emojiRow}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              setSelected(emoji);
              setSaved(false);
            }}
            className={`${styles.emojiBtn} ${
              selected === emoji ? styles.emojiBtnSelected : ""
            }`}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <textarea
        className={styles.textarea}
        placeholder="Add a note (optional)"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        rows={3}
      />

      <button
        className={`${styles.saveBtn} ${
          !selected || saved || saving ? styles.saveBtnDisabled : ""
        }`}
        onClick={handleSave}
        disabled={!selected || saved || saving}
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Mood"}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}