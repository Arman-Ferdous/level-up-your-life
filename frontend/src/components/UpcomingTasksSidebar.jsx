import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TaskAPI } from "../api/task.api";
import styles from "./UpcomingTasksSidebar.module.css";

const WEEKDAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getNextReminderTime(task) {
  if (task.type === "deadline") {
    return task.dueDate ? new Date(task.dueDate).getTime() : Number.POSITIVE_INFINITY;
  }

  if (task.type === "habit" && Array.isArray(task.reminderWeekdays) && task.reminderWeekdays.length > 0) {
    const today = new Date();
    const currentDayIndex = today.getDay();
    const weekdayIndexes = task.reminderWeekdays
      .map((day) => WEEKDAY_ORDER.indexOf(day))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);

    for (const index of weekdayIndexes) {
      const delta = (index - currentDayIndex + 7) % 7;
      const next = new Date(today);
      next.setHours(0, 0, 0, 0);
      next.setDate(today.getDate() + delta);
      return next.getTime();
    }
  }

  return Number.POSITIVE_INFINITY;
}

function sortSidebarTasks(allTasks) {
  const timedTasks = allTasks
    .filter((task) => !task.completed && (task.type === "deadline" || task.type === "habit"))
    .sort((left, right) => getNextReminderTime(left) - getNextReminderTime(right));

  const oneTimeTasks = allTasks
    .filter((task) => !task.completed && task.type === "once")
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  return [...timedTasks.slice(0, 5), ...oneTimeTasks.slice(0, 3)];
}

function isNoDeadlineTask(task) {
  return task.type === "once";
}

function getHabitScheduleLabel(reminderWeekdays = []) {
  if (reminderWeekdays.length === 0) return "No weekdays";
  return reminderWeekdays.map((day) => day.slice(0, 1).toUpperCase() + day.slice(1)).join(", ");
}

export default function UpcomingTasksSidebar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState("");

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError("");
      try {
        const res = await TaskAPI.getTasks(null);
        const allTasks = res.data.tasks || [];

        const upcomingTasks = sortSidebarTasks(allTasks);

        setTasks(upcomingTasks);
      } catch (err) {
        setError("Failed to load tasks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  async function handleCompleteTask(taskId) {
    setCompletingId(taskId);
    setError("");

    try {
      await TaskAPI.updateTask(taskId, { completed: true });
      setTasks((current) => current.filter((task) => task._id !== taskId));
    } catch {
      setError("Failed to mark task as finished");
    } finally {
      setCompletingId("");
    }
  }

  const timedTasks = tasks.filter((task) => !isNoDeadlineTask(task));
  const noDeadlineTasks = tasks.filter((task) => isNoDeadlineTask(task));

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upcoming Tasks</h3>
        <Link to="/tasks?new=1" className={styles.addButton}>+ Add Task</Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.message}>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className={styles.message}>No upcoming tasks</p>
      ) : (
        <div className={styles.taskList}>
          {timedTasks.map((task) => {
            const nextReminderTime = getNextReminderTime(task);
            const isOverdue =
              task.type === "deadline" && task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            const daysLeft = Number.isFinite(nextReminderTime)
              ? Math.floor((nextReminderTime - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={task._id}
                className={`${styles.taskItem} ${
                  isOverdue ? styles.taskOverdue : ""
                } ${task.type === "habit" ? styles.taskHabit : ""} ${task.type === "once" ? styles.taskOnce : ""}`}
              >
                <button
                  type="button"
                  className={styles.completeButton}
                  onClick={() => handleCompleteTask(task._id)}
                  disabled={completingId === task._id}
                  aria-label={`Mark ${task.title} as finished`}
                  title="Mark as finished"
                >
                  {completingId === task._id ? "..." : "✓"}
                </button>
                <div className={styles.taskItemBody}>
                  <p className={styles.taskItemTitle}>{task.title}</p>
                  {task.type === "habit" && task.reminderWeekdays?.length > 0 && (
                    <p className={styles.scheduleText}>{getHabitScheduleLabel(task.reminderWeekdays)}</p>
                  )}
                  {daysLeft !== null && (
                    <span
                      className={`${styles.daysLabel} ${
                        isOverdue
                          ? styles.daysOverdue
                          : daysLeft <= 1
                          ? styles.daysSoon
                          : styles.daysNormal
                      }`}
                    >
                      {isOverdue
                        ? "OVERDUE"
                        : daysLeft === 0
                        ? "Today"
                        : daysLeft === 1
                        ? "Tomorrow"
                        : `${daysLeft}d left`}
                    </span>
                  )}
                  {task.type === "once" && (
                    <span className={styles.daysAnytime}>Any time</span>
                  )}
                </div>
                <div className={styles.taskMeta}>
                  <span
                    className={`${styles.typeTag} ${
                      task.type === "habit"
                        ? styles.typeHabit
                        : task.type === "once"
                        ? styles.typeOnce
                        : styles.typeDeadline
                    }`}
                  >
                    {task.type === "habit" ? "Habit" : task.type === "once" ? "One-time" : "Due"}
                  </span>
                </div>
              </div>
            );
          })}
          {timedTasks.length > 0 && noDeadlineTasks.length > 0 && (
            <div className={styles.sectionDivider}>
              <span className={styles.sectionDividerText}>No deadline tasks</span>
            </div>
          )}
          {noDeadlineTasks.map((task) => (
            <div
              key={task._id}
              className={`${styles.taskItem} ${styles.taskOnce}`}
            >
              <button
                type="button"
                className={styles.completeButton}
                onClick={() => handleCompleteTask(task._id)}
                disabled={completingId === task._id}
                aria-label={`Mark ${task.title} as finished`}
                title="Mark as finished"
              >
                {completingId === task._id ? "..." : "✓"}
              </button>
              <div className={styles.taskItemBody}>
                <p className={styles.taskItemTitle}>{task.title}</p>
                <span className={styles.daysAnytime}>Any time</span>
              </div>
              <div className={styles.taskMeta}>
                <span className={`${styles.typeTag} ${styles.typeOnce}`}>
                  One-time
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
