import { api } from "./axios";

export const SubscriptionAPI = {
  pay: (payload) => api.post("/api/subscription/pay", payload),
  getAdminRevenue: () => api.get("/api/subscription/admin/revenue")
};
