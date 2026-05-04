import { api } from "./axios";

export const AiAPI = {
  getGuide: (payload) => api.post("/api/ai/guide", payload),
  trackAction: (payload) => api.post("/api/ai/track", payload),
  chat: (payload) => api.post("/api/ai/chat", payload)
};