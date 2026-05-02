import { api } from "./axios";

export const ChallengeAPI = {
  create: (payload) => api.post("/api/challenges", payload),
  getAll: () => api.get("/api/challenges"),
  complete: (id) => api.post(`/api/challenges/${id}/complete`),
  fail: (id) => api.post(`/api/challenges/${id}/fail`),
  getMonthly: () => api.get("/api/challenges/monthly"),
  createMonthly: (payload) => api.post("/api/challenges/monthly", payload),
  deleteMonthly: (id) => api.delete(`/api/challenges/monthly/${id}`),
  registerMonthly: (id) => api.post(`/api/challenges/monthly/${id}/register`),
  completeMonthly: (id) => api.post(`/api/challenges/monthly/${id}/complete`),
  getMonthlyLeaderboard: (id) => api.get(`/api/challenges/monthly/${id}/leaderboard`)
};
