import { api } from "./axios";

export const AuthAPI = {
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get("/api/auth/me")
};