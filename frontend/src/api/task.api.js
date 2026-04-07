import { api } from "./axios";

export const TaskAPI = {
  createTask: (payload) => api.post("/api/tasks", payload),
  getTasks: (params = {}) => {
    const query = typeof params === "string" ? { type: params } : params || {};
    return api.get("/api/tasks", { params: query });
  },
  updateTask: (id, payload) => api.put(`/api/tasks/${id}`, payload),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`)
};
