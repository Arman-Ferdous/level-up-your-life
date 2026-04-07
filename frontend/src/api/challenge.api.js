import { api } from "./axios";

export const ChallengeAPI = {
  create: (payload) => api.post("/api/challenges", payload),
  getAll: () => api.get("/api/challenges"),
  complete: (id) => api.post(`/api/challenges/${id}/complete`),
  fail: (id) => api.post(`/api/challenges/${id}/fail`)
};
