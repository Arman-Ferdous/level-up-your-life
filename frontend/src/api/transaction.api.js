import { api } from "./axios";

export const TransactionAPI = {
  list(params) {
    return api.get("/api/transactions", { params });
  },
  stats(params) {
    return api.get("/api/transactions/stats", { params });
  },
  create(payload) {
    return api.post("/api/transactions", payload);
  },
  update(id, payload) {
    return api.put(`/api/transactions/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/api/transactions/${id}`);
  },
};
