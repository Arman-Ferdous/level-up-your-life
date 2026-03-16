import { api } from "./axios";

export const TaskAPI = {
  createTask: (payload) => api.post("/api/tasks", payload),
  getTasks: (type) => api.get("/api/tasks", { params: { type } }),
  updateTask: (id, payload) => api.put(`/api/tasks/${id}`, payload),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`)
};
