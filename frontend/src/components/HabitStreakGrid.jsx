import { useEffect, useState, useMemo } from "react";
import { TaskAPI } from "../api/task.api";
import styles from "./HabitStreakGrid.module.css";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const STREAK_MILESTONES = [
  { days: 2, points: 5 },
  { days: 5, points: 15 },
  { days: 10, points: 50 },
  { days: 15, points: 100 },
  { days: 30, points: 200 }
];

/**
 * Get last N days from today, grouped by week
 * Returns array of weeks, where each week is array of dates
 */
function getWeeksData(days = 84) {
  const weeks = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const weekIndex = Math.floor((days - 1 - offset) / 7);

    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }
    weeks[weekIndex].push(date);
  }

  return weeks;
}

/**
 * Format date as YYYY-MM-DD for comparison
 */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasCompletion(historyEntries = [], dayKey) {
  return historyEntries.some((entry) => entry.dayKey === dayKey);
}

function computeHabitStreak(habit) {
  if (!Array.isArray(habit.reminderWeekdays) || habit.reminderWeekdays.length === 0) return 0;

  const scheduled = new Set(habit.reminderWeekdays);
  const historyEntries = Array.isArray(habit.habitCompletionHistory) ? habit.habitCompletionHistory : [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < 400; i += 1) {
    const weekday = DAY_ORDER[cursor.getDay()];
    if (scheduled.has(weekday)) {
      const dayKey = formatDateKey(cursor);
      if (hasCompletion(historyEntries, dayKey)) {
        streak += 1;
      } else {
        break;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getNextMilestone(streak) {
  return STREAK_MILESTONES.find((m) => streak < m.days) || null;
}

export default function HabitStreakGrid({ showHeader = true }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHabits() {
      try {
        setLoading(true);
        const res = await TaskAPI.getTasks({ type: "habit" });
        if (isMounted) {
          setHabits(res.data.tasks || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load habits");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHabits();
    return () => {
      isMounted = false;
    };
  }, []);

  const weeks = useMemo(() => getWeeksData(84), []);

  // Build a completion map: { habitId -> { dateKey -> boolean } }
  const completionMap = useMemo(() => {
    const map = {};
    habits.forEach((habit) => {
      map[habit._id] = {};
      if (habit.habitCompletionHistory) {
        habit.habitCompletionHistory.forEach((completion) => {
          map[habit._id][completion.dayKey] = true;
        });
      }
    });
    return map;
  }, [habits]);

  // Determine color for a cell: gray if not scheduled, light/medium/dark green if completed
  const getCellColor = (habit, date) => {
    const dateKey = formatDateKey(date);
    const dayOfWeek = date.getDay();
    const dayLabels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayKey = dayLabels[dayOfWeek];

    // Check if this habit is scheduled for this day of the week
    const isScheduledDay =
      habit.reminderWeekdays && habit.reminderWeekdays.includes(dayKey);

    if (!isScheduledDay) {
      return "unscheduled";
    }

    // Check if completed on this date
    const isCompleted = completionMap[habit._id]?.[dateKey] ?? false;
    return isCompleted ? "completed" : "missed";
  };

  if (loading) {
    return <p className={styles.status}>Loading habits...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (habits.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No habits yet. Create one to see your consistency tracker!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showHeader && (
        <div className={styles.header}>
          <h3 className={styles.title}>Habit Consistency</h3>
          <p className={styles.subtitle}>Last 12 weeks</p>
        </div>
      )}

      {habits.map((habit) => {
        const streak = computeHabitStreak(habit);
        const nextMilestone = getNextMilestone(streak);

        return (
          <div key={habit._id} className={styles.habitRow}>
            <div className={styles.habitLabel}>
              <p className={styles.habitName}>{habit.title}</p>
            </div>

            <div className={styles.gridContainer}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className={styles.week}>
                  {week.map((date) => {
                    const color = getCellColor(habit, date);
                    const dateKey = formatDateKey(date);
                    const dayOfWeek = date.getDay();

                    return (
                      <div
                        key={dateKey}
                        className={`${styles.cell} ${styles[`cell-${color}`]}`}
                        title={`${WEEKDAY_LABELS[dayOfWeek]} ${date.toLocaleDateString()}`}
                        aria-label={`${habit.title} on ${date.toLocaleDateString()}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className={styles.streakInfo}>
              <p className={styles.currentStreak}>🔥 {streak} day{streak === 1 ? "" : "s"}</p>
              {nextMilestone ? (
                <p className={styles.nextGoal}>
                  Next: {nextMilestone.days} days (+{nextMilestone.points} pts)
                </p>
              ) : (
                <p className={styles.nextGoal}>Top goal reached (+200 pts tier)</p>
              )}
            </div>
          </div>
        );
      })}

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendCell} ${styles["cell-unscheduled"]}`} />
          <span>Not scheduled</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendCell} ${styles["cell-missed"]}`} />
          <span>Missed</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendCell} ${styles["cell-completed"]}`} />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
