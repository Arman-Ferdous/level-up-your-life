import { api } from "./axios";

export const RewardsAPI = {
  getDailyStatus: () => api.get("/api/rewards/daily-login/status"),
  claimDailyBonus: () => api.post("/api/rewards/daily-login")
};
