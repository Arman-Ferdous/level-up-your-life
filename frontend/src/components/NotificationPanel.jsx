import React, { useState, useRef, useEffect } from "react";
import styles from "./NotificationPanel.module.css";
import { useNotifications } from "../context/NotificationContext.jsx";
import AiGuide from "./AiGuide";

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationTypeClass = (type) => {
    if (type === "task_completed") return "completed";
    if (type === "task_due") return "due";
    if (type === "task_overdue") return "overdue";
    return "";
  };

  const getNotificationTypeLabel = (type) => {
    const labels = {
      task_due: "Due",
      task_completed: "Completed",
      task_reminder: "Reminder",
      task_overdue: "Overdue"
    };
    return labels[type] || "Notification";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (e, notificationId, isRead) => {
    e.stopPropagation();
    if (!isRead) {
      try {
        await markAsRead(notificationId);
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return (
    <div className={styles.notificationBell} ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "0.5rem"
        }}
      >
        <span className={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && <div className={styles.badge}>{unreadCount}</div>}
      </button>

      {isOpen && (
        <div className={styles.notificationPanel}>
          <div className={styles.notificationHeader}>
            <span className={styles.headerTitle}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </span>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  className={styles.headerBtn}
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className={styles.aiGuideWrap}>
            <AiGuide surface="notifications" compact />
          </div>

          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyText}>No notifications yet</div>
            </div>
          ) : (
            <ul className={styles.notificationList}>
              {notifications.map(notification => (
                <li
                  key={notification._id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ""}`}
                >
                  <div className={styles.notificationMeta}>
                    <span
                      className={`${styles.notificationType} ${styles[getNotificationTypeClass(notification.type)]}`}
                    >
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    <span className={styles.notificationTime}>
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>

                  <div className={styles.notificationTitle}>{notification.title}</div>
                  <div className={styles.notificationMessage}>{notification.message}</div>

                  <div className={styles.notificationActions}>
                    {!notification.read && (
                      <button
                        className={styles.actionBtn}
                        onClick={e => handleMarkAsRead(e, notification._id, notification.read)}
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={e => handleDelete(e, notification._id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
