import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { TaskAPI } from "../api/task.api";
import styles from "./WeeklyReviewPage.module.css";

const MOOD_SCORE = {
  "😭": 1,
  "😞": 2,
  "😐": 3,
  "🙂": 4,
  "😊": 5,
  "🤩": 6
};

function parseDateKey(key) {
  // YYYY-MM-DD
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function WeeklyReviewPage() {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const startKey = params.get("start");
  const endKey = params.get("end");

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!startKey || !endKey) return;

    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const taskRes = await TaskAPI.getTasks();

        if (!isMounted) return;

        setTasks(taskRes.data.tasks || []);
      } catch (err) {
        // ignore – show empty state
        setTasks([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [startKey, endKey]);

  const startDate = startKey ? parseDateKey(startKey) : null;
  const endDate = endKey ? parseDateKey(endKey) : null;

  const completedTasks = useMemo(() => {
    if (!startDate || !endDate) return [];
    return tasks.filter((t) => t.completed && t.completedOn).filter((t) => {
      const d = new Date(t.completedOn);
      return d >= startDate && d <= endDate;
    });
  }, [tasks, startDate, endDate]);

  const dueTasks = useMemo(() => {
    if (!startDate || !endDate) return [];
    return tasks.filter((t) => t.dueDate).filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startDate && d <= endDate;
    });
  }, [tasks, startDate, endDate]);

  const missedTasks = useMemo(() => dueTasks.filter((t) => !t.completed), [dueTasks]);

  // Simple AI suggestions heuristics
  const suggestion = useMemo(() => {
    if (!startDate || !endDate) return "";
    if (missedTasks.length > dueTasks.length * 0.4 && missedTasks.length >= 2) {
      return "Too much landed this week. Trim the load next week.";
    }
    if (completedTasks.length >= dueTasks.length && completedTasks.length >= 3) {
      return "Strong week. Keep the pace steady.";
    }
    if (dueTasks.length === 0 && completedTasks.length === 0) {
      return "Light week. Add one clear target next week.";
    }
    return "Balanced week. Keep priorities tight.";
  }, [missedTasks, dueTasks, completedTasks, startDate, endDate]);

  if (!startKey || !endKey) {
    return (
      <main className={styles.page}>
        <section className={styles.shell}>
          <h2 className={styles.pageTitle}>Weekly Review</h2>
          <p className={styles.rangeText}>Missing week range. Open this page from the calendar week.</p>
          <p><Link to="/calendar" className={styles.backLink}>Back to calendar</Link></p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Weekly review</p>
            <h2 className={styles.pageTitle}>Range {startKey} → {endKey}</h2>
          </div>
          <Link to="/calendar" className={styles.backLink}>Back to calendar</Link>
        </header>

        <section className={styles.suggestionHero}>
          <p className={styles.suggestionText}>{suggestion}</p>
        </section>

        {loading ? <p className={styles.loading}>Loading...</p> : (
          <section className={styles.layout}>
            <div className={styles.taskColumn}>
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Completed tasks ({completedTasks.length})</h3>
                {completedTasks.length === 0 ? (
                  <p className={styles.emptyText}>No tasks completed this week.</p>
                ) : (
                  <div className={styles.taskList}>
                    {completedTasks.map((t) => (
                      <article key={t._id} className={`${styles.taskCard} ${styles.taskCardComplete}`}>
                        <span className={styles.taskDot} />
                        <div>
                          <h4>{t.title}</h4>
                          <p>{t.completedOn ? new Date(t.completedOn).toLocaleDateString() : "Completed"}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Missed tasks ({missedTasks.length})</h3>
                {missedTasks.length === 0 ? (
                  <p className={styles.emptyText}>No missed tasks.</p>
                ) : (
                  <div className={styles.taskList}>
                    {missedTasks.map((t) => (
                      <article key={t._id} className={`${styles.taskCard} ${styles.taskCardMissed}`}>
                        <span className={styles.taskDotMuted} />
                        <div>
                          <h4>{t.title}</h4>
                          <p>{t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : "Missed"}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
