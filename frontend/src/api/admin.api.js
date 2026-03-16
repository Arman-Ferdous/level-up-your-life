import { api } from "./axios";

export const AdminAPI = {
  listUsers: () => api.get("/api/admin/users"),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`)
};
