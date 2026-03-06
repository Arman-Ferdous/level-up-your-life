import { useState, useEffect } from "react";
import { api } from "../api/axios";

const EMOJIS = ["😄", "🙂", "😐", "😔", "😡", "😴"];

export default function MoodPicker() {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchToday() {
      try {
        const res = await api.get("/api/mood/today");
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
      await api.post("/api/mood", { emoji: selected, note });
      setSaved(true);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to save mood.");
    }
  }

  if (loading) return <p style={styles.status}>Loading...</p>;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>How are you feeling today?</h2>

      <div style={styles.emojiRow}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { setSelected(emoji); setSaved(false); }}
            style={{
              ...styles.emojiBtn,
              ...(selected === emoji ? styles.emojiBtnSelected : {}),
            }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <textarea
        style={styles.textarea}
        placeholder="Add a note (optional)"
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        rows={3}
      />

      <button
        style={{
          ...styles.saveBtn,
          ...((!selected || saved) ? styles.saveBtnDisabled : {}),
        }}
        onClick={handleSave}
        disabled={!selected || saved}
      >
        {saved ? "Saved ✓" : "Save Mood"}
      </button>

      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  card: {
    maxWidth: 420,
    margin: "2rem auto",
    padding: "2rem",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    textAlign: "center",
    color: "#333",
  },
  emojiRow: {
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  emojiBtn: {
    fontSize: "2rem",
    background: "none",
    border: "2px solid transparent",
    borderRadius: 8,
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
    transition: "border-color 0.15s",
  },
  emojiBtnSelected: {
    borderColor: "#6c63ff",
    backgroundColor: "#f0eeff",
  },
  textarea: {
    width: "100%",
    padding: "0.5rem",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: "0.95rem",
    resize: "vertical",
    boxSizing: "border-box",
  },
  saveBtn: {
    padding: "0.6rem 1.2rem",
    fontSize: "1rem",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#6c63ff",
    color: "#fff",
    cursor: "pointer",
  },
  saveBtnDisabled: {
    backgroundColor: "#b0a8f0",
    cursor: "default",
  },
  error: {
    color: "#e74c3c",
    margin: 0,
    fontSize: "0.9rem",
  },
  status: {
    textAlign: "center",
    color: "#888",
  },
};
