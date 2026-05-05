import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChallengeAPI } from "../api/challenge.api";
import styles from "./GlobalChallengeLeaderboard.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function GlobalChallengeLeaderboard({ challengeId, title = "Global Challenge Leaderboard" }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ChallengeAPI.getMonthlyLeaderboard(challengeId);
        if (res.data?.leaderboard) {
          // Filter to only show completed entries
          const completedEntries = res.data.leaderboard.filter(entry => entry.completed).slice(0, 10);
          setLeaderboard(completedEntries);
        } else {
          setError("Failed to load leaderboard");
        }
      } catch (err) {
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [challengeId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>Who completed it first</p>
        </div>
        <Link to="/leaderboard?tab=challenge" className={styles.viewAllLink}>
          View All →
        </Link>
      </div>

      <div className={styles.content}>
        {loading && (
          <div className={styles.state}>
            <div className={styles.spinner} />
            <p>Loading winners…</p>
          </div>
        )}

        {error && !loading && (
          <div className={`${styles.state} ${styles.stateError}`}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div className={`${styles.state} ${styles.stateEmpty}`}>
            <span className={styles.emptyIcon}>🏁</span>
            <p>No completions yet!</p>
          </div>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div className={styles.list}>
            {leaderboard.map((entry, index) => (
              <div key={`${entry.userId}-${index}`} className={styles.row}>
                <div className={styles.rank}>
                  {index < 3 ? (
                    <span className={styles.medal}>{MEDALS[index]}</span>
                  ) : (
                    <span className={styles.rankNumber}>#{entry.rank}</span>
                  )}
                </div>
                <div className={styles.name}>{entry.name}</div>
                <div className={styles.time}>
                  {entry.completedAt && (
                    <span className={styles.completedTime}>
                      {new Date(entry.completedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
