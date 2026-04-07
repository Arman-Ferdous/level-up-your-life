import { api } from "./axios.js";

export const getNotifications = async (unreadOnly = false) => {
  try {
    const response = await api.get("/api/notifications", {
      params: { unreadOnly: unreadOnly ? "true" : "false" }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(
      `/api/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put("/api/notifications/read-all");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(
      `/api/notifications/${notificationId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const response = await api.delete("/api/notifications");
    return response.data;
  } catch (error) {
    throw error;
  }
};
