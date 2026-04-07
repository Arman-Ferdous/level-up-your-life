import { useContext } from "react";
import MoodPicker from "../components/MoodPicker";
import { MoodContext } from "../context/MoodContext";
import styles from "./MoodPage.module.css";

export default function MoodPage() {
  const { history, historyError } = useContext(MoodContext);

  return (
    <div className={styles.page}>
      <MoodPicker />

      <div className={styles.historyCard}>
        <h3 className={styles.historyTitle}>Last 30 Days</h3>
        {historyError && <p className={styles.error}>{historyError}</p>}
        {history.length === 0 && !historyError && (
          <p className={styles.empty}>No mood entries yet.</p>
        )}
        <ul className={styles.list}>
          {history.map((entry) => (
            <li key={entry._id} className={styles.listItem}>
              <span className={styles.date}>{entry.date}</span>
              <span className={styles.emoji}>{entry.emoji}</span>
              {entry.note && <span className={styles.note}>{entry.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
