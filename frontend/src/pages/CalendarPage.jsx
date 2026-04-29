import { useEffect, useMemo, useState, useContext } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { TaskAPI } from "../api/task.api";
import { TransactionAPI } from "../api/transaction.api";
import { MoodAPI } from "../api/mood.api";
import { MoodContext } from "../context/MoodContext";
import styles from "./CalendarPage.module.css";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MODE_OPTIONS = [
  { value: "tasks", label: "Pending Task Heatmap" },
  { value: "expense", label: "Expense Heatmap" },
  { value: "mood", label: "Mood Trend (30 Days)" }
];

// Mapping from emoji to numeric mood score (1 = worst, 6 = best)
const MOOD_SCORE = {
  "😭": 1,
  "😞": 2,
  "😐": 3,
  "🙂": 4,
  "😊": 5,
  "🤩": 6
};

function getMonthMeta(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  return { year, month, daysInMonth, firstWeekday };
}

function getDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function taskSegmentColor(index) {
  const hue = (index * 57) % 360;
  return `hsl(${hue} 78% 58%)`;
}

function getExpenseColor(net, maxMagnitude) {
  if (!net || !maxMagnitude) {
    return "hsl(210 20% 94%)";
  }

  const intensity = Math.min(Math.abs(net) / maxMagnitude, 1);
  const lightness = 92 - intensity * 44;

  if (net > 0) {
    return `hsl(145 68% ${lightness}%)`;
  }

  return `hsl(8 82% ${lightness}%)`;
}

function getLastNDates(days) {
  const dates = [];
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const next = new Date(today);
    next.setDate(today.getDate() - offset);
    dates.push(next);
  }
  return dates;
}

export default function CalendarPage() {
  const [activeMode, setActiveMode] = useState("tasks");
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { year, month, daysInMonth, firstWeekday } = useMemo(() => getMonthMeta(monthCursor), [monthCursor]);

  useEffect(() => {
    let isMounted = true;

    async function loadMonthData() {
      setLoading(true);
      setError("");

      try {
        const [taskRes, txRes] = await Promise.all([
          TaskAPI.getTasks(),
          TransactionAPI.list({ year, month })
        ]);

        if (!isMounted) return;

        setTasks(taskRes.data.tasks || []);
        setTransactions(txRes.data.transactions || []);
        // moods come from MoodContext (keeps calendar in sync when mood entries update)
        // leave setMoods to the separate effect below that listens to context
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load calendar data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMonthData();

    return () => {
      isMounted = false;
    };
  }, [year, month]);

  // Listen to global mood history and map into calendar moods
  const { history: moodHistory } = useContext(MoodContext);

  useEffect(() => {
    setMoods(moodHistory || []);
  }, [moodHistory]);

  const taskDueByDay = useMemo(() => {
    const daily = new Map();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    tasks
      .filter((task) => !task.completed && task.dueDate)
      .forEach((task) => {
        const due = new Date(task.dueDate);
        if (due < monthStart || due >= monthEnd) return;

        const key = getDateKey(year, month, due.getDate());
        const existing = daily.get(key) || [];
        existing.push(task);
        daily.set(key, existing);
      });

    return daily;
  }, [tasks, year, month]);

  const expenseByDay = useMemo(() => {
    const netByDay = new Map();
    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const key = getDateKey(year, month, date.getDate());
      const amount = Number(tx.amount) || 0;
      const current = netByDay.get(key) || 0;
      netByDay.set(key, tx.type === "income" ? current + amount : current - amount);
    });
    return netByDay;
  }, [transactions, year, month]);

  const maxExpenseMagnitude = useMemo(() => {
    const values = Array.from(expenseByDay.values()).map((value) => Math.abs(value));
    return values.length ? Math.max(...values) : 0;
  }, [expenseByDay]);

  const moodChartData = useMemo(() => {
    const latestByDate = new Map();

    moods.forEach((entry) => {
      const value = MOOD_SCORE[entry.emoji];
      if (!value) return;

      const existing = latestByDate.get(entry.date);
      const existingTs = existing ? new Date(existing.updatedAt || existing.createdAt || 0).getTime() : -1;
      const nextTs = new Date(entry.updatedAt || entry.createdAt || 0).getTime();

      if (!existing || nextTs >= existingTs) {
        latestByDate.set(entry.date, entry);
      }
    });

    return getLastNDates(30).map((date) => {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const found = latestByDate.get(dateKey);
      return {
        dateKey,
        label: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
        mood: found ? MOOD_SCORE[found.emoji] : null,
        emoji: found?.emoji || ""
      };
    });
  }, [moods]);

  const monthLabel = monthCursor.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Calendar Heatmaps</h1>
          <p className={styles.subtitle}>Track deadline pressure, daily financial pulse, and mood trajectory in one calendar.</p>
        </div>

        <div className={styles.controlsRow}>
          {activeMode !== "mood" ? (
            <div className={styles.monthNav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                Prev
              </button>
              <span className={styles.monthLabel}>{monthLabel}</span>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                Next
              </button>
            </div>
          ) : (
            <div className={styles.moodRangeLabel}>Last 30 Days</div>
          )}

          <div className={styles.modeTabs}>
            {MODE_OPTIONS.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={`${styles.modeBtn} ${activeMode === mode.value ? styles.modeBtnActive : ""}`}
                onClick={() => setActiveMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.legend}>
          {activeMode === "tasks" && <span>Each color bar is one pending deadline task. 3+ tasks due on one day = severe pressure.</span>}
          {activeMode === "expense" && <span>Green means net earnings, red means net spending. Darker shade means higher magnitude.</span>}
          {activeMode === "mood" && <span>Highest point is your best mood and lowest point is your worst mood over the last 30 days.</span>}
        </div>

        {loading ? (
          <p className={styles.loading}>Loading calendar...</p>
        ) : activeMode === "mood" ? (
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={moodChartData} margin={{ top: 14, right: 16, left: 6, bottom: 6 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#dbeafe" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#475569", fontSize: 11 }}
                  interval={2}
                />
                <YAxis
                  domain={[1, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tickFormatter={(value) => ({ 1: "Worst", 3: "Neutral", 6: "Best" }[value] || "")}
                  tick={{ fill: "#475569", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, _name, item) => {
                    const emoji = item?.payload?.emoji || "No entry";
                    return [`${emoji} (${value || "N/A"})`, "Mood"];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#db2777"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#a21caf", stroke: "#fff", strokeWidth: 1 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.calendarWrap}>
            <div className={styles.weekHeader}>
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className={styles.weekCell}>{label}</div>
              ))}
            </div>

            <div className={styles.grid}>
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <div key={`blank-${index}`} className={styles.dayCellEmpty} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateKey = getDateKey(year, month, day);

                if (activeMode === "tasks") {
                  const dueTasks = taskDueByDay.get(dateKey) || [];
                  const severe = dueTasks.length > 2;

                  return (
                    <div
                      key={dateKey}
                      className={`${styles.dayCell} ${severe ? styles.dayCellSevere : ""}`}
                    >
                      <span className={styles.dayNum}>{day}</span>
                      <div className={styles.segmentStack}>
                        {dueTasks.slice(0, 5).map((task, taskIndex) => (
                          <div
                            key={task._id}
                            className={styles.segment}
                            style={{ backgroundColor: taskSegmentColor(taskIndex) }}
                            title={task.title}
                          />
                        ))}
                      </div>
                      {dueTasks.length > 5 && <span className={styles.moreCount}>+{dueTasks.length - 5}</span>}
                    </div>
                  );
                }

                if (activeMode === "expense") {
                  const net = expenseByDay.get(dateKey) || 0;
                  return (
                    <div
                      key={dateKey}
                      className={styles.dayCell}
                      style={{ backgroundColor: getExpenseColor(net, maxExpenseMagnitude) }}
                    >
                      <span className={styles.dayNum}>{day}</span>
                      {net !== 0 && <span className={styles.dayValue}>{net > 0 ? `+${Math.round(net)}` : Math.round(net)}</span>}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
