import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TaskAPI } from "../api/task.api";
import styles from "./TodoList.module.css";

const WEEKDAY_OPTIONS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
];

export default function TodoList({ initialShowForm = false, groupId, groupName }) {
  const { user } = useAuth();
  const currentUserId = String(user?.id || user?._id || "");
  const isGroupScope = Boolean(groupId);
  const [tasks, setTasks] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(initialShowForm);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "once",
    dueDate: "",
    reminderWeekdays: [],
    priority: "medium"
  });

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const query = {
        ...(activeTab === "all" ? {} : { type: activeTab }),
        ...(groupId ? { groupId } : {})
      };
      const res = await TaskAPI.getTasks(query);
      setTasks(res.data.tasks || []);
      setGroupMembers(res.data.groupMembers || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [activeTab, groupId]);

  useEffect(() => {
    if (initialShowForm) {
      setShowForm(true);
    }
  }, [initialShowForm]);

  useEffect(() => {
    if (isGroupScope && activeTab === "deadline") {
      setActiveTab("all");
    }
  }, [isGroupScope, activeTab]);

  async function handleCreateTask(e) {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    if ((formData.type === "deadline" || (isGroupScope && formData.type === "once")) && !formData.dueDate) {
      setError(isGroupScope ? "Please set a deadline for this group one-time task" : "Please set a due date for deadline tasks");
      return;
    }

    if (formData.type === "habit" && formData.reminderWeekdays.length === 0) {
      setError("Please select at least one weekday for this habit");
      return;
    }

    try {
      const payload = {
        ...formData,
        ...(groupId ? { groupId } : {}),
        dueDate: (formData.type === "deadline" || (isGroupScope && formData.type === "once")) && formData.dueDate
          ? new Date(formData.dueDate).toISOString()
          : null,
        reminderWeekdays: formData.type === "habit" ? formData.reminderWeekdays : []
      };

      const res = await TaskAPI.createTask(payload);
      setTasks((current) => [res.data.task, ...current]);
      setFormData({
        title: "",
        description: "",
        type: "once",
        dueDate: "",
        reminderWeekdays: [],
        priority: "medium"
      });
      setShowForm(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create task");
    }
  }

  async function handleToggleComplete(taskId, currentStatus) {
    try {
      const res = await TaskAPI.updateTask(taskId, { completed: !currentStatus });
      setTasks((current) => current.map((task) => (task._id === taskId ? res.data.task : task)));
      if (Array.isArray(res.data.groupMembers)) {
        setGroupMembers(res.data.groupMembers);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update task");
    }
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await TaskAPI.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task._id !== taskId));
    } catch (err) {
      setError("Failed to delete task");
    }
  }

  const filteredTasks = activeTab === "all" ? tasks : tasks.filter((task) => task.type === activeTab);
  const last15DayKeys = getLast15DayKeys();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{groupName ? `${groupName} Tasks` : "My Tasks"}</h2>
          {groupName && <p className={styles.scope}>Managing tasks in this guild</p>}
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Task"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {showForm && (
        <form className={styles.form} onSubmit={handleCreateTask}>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={styles.textarea}
              rows={2}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Task Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((current) => ({
                ...current,
                type: e.target.value,
                dueDate: (e.target.value === "deadline" || (isGroupScope && e.target.value === "once"))
                  ? current.dueDate
                  : "",
                reminderWeekdays: e.target.value === "habit" ? current.reminderWeekdays : []
              }))}
              className={styles.select}
            >
              <option value="once">One-time Task</option>
              {!isGroupScope && <option value="deadline">Task with Deadline</option>}
              <option value="habit">Daily Habit</option>
            </select>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Priority:</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {(formData.type === "deadline" || (isGroupScope && formData.type === "once")) && (
            <div className={styles.formRow}>
              <label className={styles.label}>Deadline:</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={styles.input}
              />
            </div>
          )}

          {formData.type === "habit" && (
            <div className={styles.formRow}>
              <label className={styles.label}>Reminder Weekdays:</label>
              <div className={styles.weekdayGrid}>
                {WEEKDAY_OPTIONS.map((day) => {
                  const selected = formData.reminderWeekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      className={`${styles.weekdayChip} ${selected ? styles.weekdayChipActive : ""}`}
                      onClick={() => setFormData((current) => ({
                        ...current,
                        reminderWeekdays: selected
                          ? current.reminderWeekdays.filter((value) => value !== day.value)
                          : [...current.reminderWeekdays, day.value]
                      }))}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitBtn}>
            Create Task
          </button>
        </form>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({tasks.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "once" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("once")}
        >
          One-time
        </button>
        {!isGroupScope && (
          <button
            className={`${styles.tab} ${activeTab === "deadline" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("deadline")}
          >
            Deadlines
          </button>
        )}
        <button
          className={`${styles.tab} ${activeTab === "habit" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("habit")}
        >
          Habits
        </button>
      </div>

      {loading ? (
        <p className={styles.message}>Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <p className={styles.message}>No tasks yet. Add one to get started!</p>
      ) : (
        <div className={styles.taskList}>
          {filteredTasks.map((task) => {
            const checked = getCurrentUserCompletion(task, currentUserId, isGroupScope);
            const isCompletedCard = isGroupScope && task.type === "habit" ? checked : task.completed;

            return (
              <div
                key={task._id}
                className={`${styles.taskItem} ${isCompletedCard ? styles.taskCompleted : ""}`}
              >
              <div className={styles.taskCheckbox}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleComplete(task._id, checked)}
                  className={styles.checkbox}
                />
              </div>

              <div className={styles.taskContent}>
                <h3 className={styles.taskTitle}>{task.title}</h3>
                {task.description && <p className={styles.taskDesc}>{task.description}</p>}

                <div className={styles.taskMeta}>
                  <span className={`${styles.tag} ${styles[`tag${capitalize(task.type)}`]}`}>
                    {formatType(task.type)}
                  </span>
                  <span className={`${styles.priority} ${styles[`priority${capitalize(task.priority)}`]}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className={styles.dueDate}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {task.type === "habit" && task.reminderWeekdays?.length > 0 && (
                    <span className={styles.weekdaySummary}>
                      {task.reminderWeekdays.map(formatWeekday).join(", ")}
                    </span>
                  )}
                </div>

                {isGroupScope && task.type === "once" && (
                  <div className={styles.groupProgressBlock}>
                    <p className={styles.groupProgressText}>
                      Completed by {getCheckedUsers(task).length}/{groupMembers.length} members
                    </p>
                    {!task.completed && (
                      <p className={styles.groupProgressNames}>
                        {getCheckedUsers(task)
                          .map((checkedUserId) => groupMembers.find((member) => member.userId === checkedUserId)?.name)
                          .filter(Boolean)
                          .join(", ") || "No one has checked this task yet"}
                      </p>
                    )}
                  </div>
                )}

                {isGroupScope && task.type === "habit" && (
                  <div className={styles.habitHistoryWrap}>
                    <div className={styles.habitHistoryHeader}>
                      <span className={styles.habitHistoryMemberLabel}>Member</span>
                      <div className={styles.habitHistoryDays}>
                        {last15DayKeys.map((dayKey) => (
                          <span key={dayKey} className={styles.habitDayLabel}>{formatShortDay(dayKey)}</span>
                        ))}
                      </div>
                    </div>

                    {groupMembers.map((member) => (
                      <div key={member.userId} className={styles.habitHistoryRow}>
                        <span className={styles.habitMemberName}>{member.name}</span>
                        <div className={styles.habitHistoryDays}>
                          {last15DayKeys.map((dayKey) => {
                            const completed = hasHabitCompletion(task, member.userId, dayKey);
                            return (
                              <span
                                key={`${member.userId}-${dayKey}`}
                                className={`${styles.habitDayDot} ${completed ? styles.habitDayDotDone : ""}`}
                                title={`${member.name} • ${dayKey}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteTask(task._id)}
                title="Delete task"
              >
                ✕
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getCheckedUsers(task) {
  if (!Array.isArray(task.groupCompletionUsers)) {
    return [];
  }

  return task.groupCompletionUsers.map((entry) => String(entry.userId));
}

function getCurrentUserCompletion(task, currentUserId, isGroupScope) {
  if (!isGroupScope) {
    return Boolean(task.completed);
  }

  if (!currentUserId) {
    return false;
  }

  if (task.type === "once") {
    return getCheckedUsers(task).includes(currentUserId);
  }

  if (task.type === "habit") {
    return hasHabitCompletion(task, currentUserId, toLocalDayKey());
  }

  return Boolean(task.completed);
}

function hasHabitCompletion(task, userId, dayKey) {
  if (!Array.isArray(task.habitCompletionHistory)) {
    return false;
  }

  return task.habitCompletionHistory.some(
    (entry) => String(entry.userId) === String(userId) && entry.dayKey === dayKey
  );
}

function getLast15DayKeys() {
  const today = new Date();
  const dayKeys = [];

  for (let offset = 14; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    dayKeys.push(toLocalDayKey(date));
  }

  return dayKeys;
}

function toLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDay(dayKey) {
  const [, month, day] = dayKey.split("-");
  return `${month}/${day}`;
}

function formatType(type) {
  const map = { once: "One-time", deadline: "Deadline", habit: "Daily Habit" };
  return map[type] || type;
}

function formatWeekday(day) {
  const map = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun"
  };
  return map[day] || day;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
