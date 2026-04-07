import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as notificationAPI from "../api/notification.api.js";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationAPI.getNotifications(unreadOnly);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationAPI.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return response;
    } catch (err) {
      setError(err.message || "Failed to mark notification as read");
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationAPI.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      return response;
    } catch (err) {
      setError(err.message || "Failed to mark all as read");
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => {
        const removed = prev.find(n => n._id === notificationId);
        if (removed && !removed.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n._id !== notificationId);
      });
      return response;
    } catch (err) {
      setError(err.message || "Failed to delete notification");
      throw err;
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      const response = await notificationAPI.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      return response;
    } catch (err) {
      setError(err.message || "Failed to delete all notifications");
      throw err;
    }
  }, []);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
