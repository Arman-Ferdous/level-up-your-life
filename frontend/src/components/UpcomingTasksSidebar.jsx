import { useEffect, useRef, useState } from "react";
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
  return allTasks.filter((task) => !task.completed);
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
  const [completingIds, setCompletingIds] = useState([]);
  const [completedFlashIds, setCompletedFlashIds] = useState([]);
  const [undoQueue, setUndoQueue] = useState([]);
  const undoTimerMapRef = useRef(new Map());

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError("");
      try {
        const res = await TaskAPI.getTasks(null);
        const allTasks = res.data.tasks || [];
        setTasks(sortSidebarTasks(allTasks));
      } catch (err) {
        setError("Failed to load tasks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();

    return () => {
      undoTimerMapRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      undoTimerMapRef.current.clear();
    };
  }, []);

  async function handleCompleteTask(taskId) {
    if (completingIds.includes(taskId)) return;

    setCompletingIds((current) => [...current, taskId]);
    setError("");
    const taskToComplete = tasks.find((task) => task._id === taskId);

    try {
      await TaskAPI.updateTask(taskId, { completed: true });
      setCompletingIds((current) => current.filter((id) => id !== taskId));
      setCompletedFlashIds((current) => (current.includes(taskId) ? current : [...current, taskId]));

      if (taskToComplete) {
        setUndoQueue((current) => {
          const exists = current.some((item) => item.task._id === taskId);
          if (exists) return current;
          return [...current, { id: taskId, task: taskToComplete }];
        });
      }

      const existingTimer = undoTimerMapRef.current.get(taskId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timeoutId = window.setTimeout(() => {
        setTasks((current) => current.filter((task) => task._id !== taskId));
        setCompletedFlashIds((current) => current.filter((id) => id !== taskId));
        setUndoQueue((current) => current.filter((item) => item.task._id !== taskId));
        undoTimerMapRef.current.delete(taskId);
      }, 5000);

      undoTimerMapRef.current.set(taskId, timeoutId);
    } catch {
      setError("Failed to mark task as finished");
      setCompletingIds((current) => current.filter((id) => id !== taskId));
    }
  }

  async function handleUndoTask(taskId) {
    const timerId = undoTimerMapRef.current.get(taskId);
    if (timerId) {
      window.clearTimeout(timerId);
      undoTimerMapRef.current.delete(taskId);
    }

    setCompletingIds((current) => [...current, taskId]);

    try {
      await TaskAPI.updateTask(taskId, { completed: false });
      setCompletedFlashIds((current) => current.filter((id) => id !== taskId));
      setUndoQueue((current) => current.filter((item) => item.task._id !== taskId));
    } catch {
      setError("Failed to undo task completion");
    } finally {
      setCompletingIds((current) => current.filter((id) => id !== taskId));
    }
  }

  const upcomingDeadlineTasks = tasks
    .filter((task) => task.type === "deadline")
    .sort((left, right) => getNextReminderTime(left) - getNextReminderTime(right))
    .slice(0, 3);

  const habitsTasks = tasks
    .filter((task) => task.type === "habit")
    .sort((left, right) => getNextReminderTime(left) - getNextReminderTime(right))
    .slice(0, 3);

  const noDeadlineTasks = tasks
    .filter((task) => isNoDeadlineTask(task))
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .slice(0, 3);

  function renderTask(task, extraClassName = "") {
    const nextReminderTime = getNextReminderTime(task);
    const isOverdue =
      task.type === "deadline" && task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const daysLeft = Number.isFinite(nextReminderTime)
      ? Math.floor((nextReminderTime - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
      : null;
    const isCompleting = completingIds.includes(task._id);
    const isCompletedFlash = completedFlashIds.includes(task._id);

    return (
      <div
        key={task._id}
        className={`${styles.taskRow} ${extraClassName} ${isOverdue ? styles.taskOverdue : ""} ${
          isCompleting ? styles.taskCompleting : ""
        } ${isCompletedFlash ? styles.taskCompletedFlash : ""}`}
      >
        <button
          type="button"
          className={styles.completeButton}
          onClick={() => handleCompleteTask(task._id)}
          disabled={isCompleting || isCompletedFlash}
          aria-label={`Mark ${task.title} as finished`}
          title="Mark as finished"
        >
          {isCompleting ? "..." : "✓"}
        </button>

        <div className={styles.taskTextBlock}>
          <p className={`${styles.taskTitle} ${isCompletedFlash ? styles.taskTitleCompleted : ""}`}>
            <span className={styles.taskTitleText}>{task.title}</span>
          </p>
          {task.type === "habit" && task.reminderWeekdays?.length > 0 && (
            <p className={styles.scheduleText}>{getHabitScheduleLabel(task.reminderWeekdays)}</p>
          )}
          {daysLeft !== null && (
            <span
              className={`${styles.daysLabel} ${
                isOverdue ? styles.daysOverdue : daysLeft <= 1 ? styles.daysSoon : styles.daysNormal
              }`}
            >
              {isOverdue ? "OVERDUE" : daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
            </span>
          )}
          {task.type === "once" && <span className={styles.daysAnytime}>Any time</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tasks</h3>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.message}>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className={styles.message}>No upcoming tasks</p>
      ) : (
        <div className={styles.taskSections}>
          <div className={styles.taskSection}>
            <h4 className={styles.subheading}>Upcoming</h4>
            <div className={styles.sectionRule} aria-hidden="true" />
            <div className={styles.taskRows}>
              {upcomingDeadlineTasks.length === 0 ? (
                <p className={styles.sectionEmpty}>No upcoming deadlines</p>
              ) : (
                upcomingDeadlineTasks.map((task) => renderTask(task, styles.timedTask))
              )}
            </div>
          </div>

          <div className={styles.taskSection}>
            <h4 className={styles.subheading}>Habits</h4>
            <div className={styles.sectionRule} aria-hidden="true" />
            <div className={styles.taskRows}>
              {habitsTasks.length === 0 ? (
                <p className={styles.sectionEmpty}>No habits</p>
              ) : (
                habitsTasks.map((task) => renderTask(task, styles.timedTask))
              )}
            </div>
          </div>

          <div className={styles.taskSection}>
            <h4 className={styles.subheading}>No deadlines</h4>
            <div className={styles.sectionRule} aria-hidden="true" />
            <div className={styles.taskRows}>
              {noDeadlineTasks.length === 0 ? (
                <p className={styles.sectionEmpty}>No one-time tasks</p>
              ) : (
                noDeadlineTasks.map((task) => renderTask(task, styles.noDeadlineTask))
              )}
            </div>
          </div>
        </div>
      )}

      {undoQueue.length > 0 && (
        <div className={styles.undoStack} aria-live="polite" role="status">
          {undoQueue.map((item) => (
            <div key={item.id} className={styles.undoToast}>
              <div>
                <p className={styles.undoTitle}>Task completed</p>
                <p className={styles.undoText}>{item.task.title}</p>
              </div>
              <button type="button" className={styles.undoButton} onClick={() => handleUndoTask(item.id)}>
                Undo
              </button>
              <div className={styles.undoProgressTrack} aria-hidden="true">
                <div className={styles.undoProgressBar} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/tasks?new=1" className={styles.addButton} aria-label="Add task">
        +
      </Link>
    </div>
  );
}
