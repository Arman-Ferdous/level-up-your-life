import { useState, useEffect } from "react";
import MoodPicker from "../components/MoodPicker";
import { api } from "../api/axios";

export default function MoodPage() {
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await api.get("/api/mood/history");
        setHistory(res.data.entries ?? []);
      } catch (e) {
        setHistoryError(e?.response?.data?.message ?? "Failed to load history.");
      }
    }
    fetchHistory();
  }, []);

  return (
    <div style={styles.page}>
      <MoodPicker />

      <div style={styles.historyCard}>
        <h3 style={styles.historyTitle}>Last 7 Days</h3>
        {historyError && <p style={styles.error}>{historyError}</p>}
        {history.length === 0 && !historyError && (
          <p style={styles.empty}>No mood entries yet.</p>
        )}
        <ul style={styles.list}>
          {history.map((entry) => (
            <li key={entry._id} style={styles.listItem}>
              <span style={styles.date}>{entry.date}</span>
              <span style={styles.emoji}>{entry.emoji}</span>
              {entry.note && <span style={styles.note}>{entry.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    paddingBottom: "2rem",
  },
  historyCard: {
    maxWidth: 420,
    margin: "0 auto",
    padding: "1.5rem",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
  },
  historyTitle: {
    margin: "0 0 1rem 0",
    fontSize: "1.1rem",
    color: "#333",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f0f0f0",
  },
  date: {
    fontSize: "0.85rem",
    color: "#888",
    minWidth: 90,
  },
  emoji: {
    fontSize: "1.5rem",
  },
  note: {
    fontSize: "0.9rem",
    color: "#555",
  },
  empty: {
    color: "#aaa",
    fontStyle: "italic",
    margin: 0,
  },
  error: {
    color: "#e74c3c",
    margin: "0 0 0.5rem 0",
    fontSize: "0.9rem",
  },
};
