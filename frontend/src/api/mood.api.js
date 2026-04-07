import { api } from "./axios";

export const MoodAPI = {
  getHistory: (params = {}) => api.get("/api/mood/history", { params }),
  getToday: (params = {}) => api.get("/api/mood/today", { params }),
  saveMood: (payload) => api.post("/api/mood", payload)
};
