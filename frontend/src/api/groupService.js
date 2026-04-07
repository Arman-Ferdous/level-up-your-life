import { api } from "./axios";

export const groupService = {
  createGroup: (payload) => api.post("/api/groups", payload),
  joinGroup: (joinCode) => api.post("/api/groups/join", { joinCode }),
  getMyGroups: () => api.get("/api/groups/my-groups"),
  discoverGroups: () => api.get("/api/groups/discover"),

  // Backward-compatible alias for the older groups page code.
  getGroups: () => api.get("/api/groups/my-groups")
};
