import { api } from "./axios";

export const groupService = {
  createGroup: (payload) => api.post("/api/groups", payload),
  joinGroup: (joinCode) => api.post("/api/groups/join", { joinCode }),
  getGroups: () => api.get("/api/groups")
};
