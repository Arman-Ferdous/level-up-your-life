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

export default function MoodPicker() {
  const { fetchHistory } = useContext(MoodContext);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchToday() {
      try {
        const todayDate = getTodayLocalDate();
        const res = await api.get("/api/mood/today", { params: { date: todayDate } });
        if (res.data.entry) {
          setSelected(res.data.entry.emoji);
          setNote(res.data.entry.note ?? "");
          setSaved(true);
        }
      } catch (e) {
        setError(e?.response?.data?.message ?? "Failed to load today's mood.");
      } finally {
        setLoading(false);
      }
    }
    fetchToday();
  }, []);

  async function handleSave() {
    if (!selected) return;
    setError(null);
    try {
      const todayDate = getTodayLocalDate();
      const timestamp = new Date().toISOString();
      await api.post("/api/mood", { 
        emoji: selected, 
        note, 
        date: todayDate,
        timestamp 
      });
      setSaved(true);
      // Refresh history in parent after saving
      fetchHistory();
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to save mood.");
    }
  }

  if (loading) return <p className={styles.status}>Loading...</p>;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>How are you feeling today?</h2>

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
          !selected || saved ? styles.saveBtnDisabled : ""
        }`}
        onClick={handleSave}
        disabled={!selected || saved}
      >
        {saved ? "Saved ✓" : "Save Mood"}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}