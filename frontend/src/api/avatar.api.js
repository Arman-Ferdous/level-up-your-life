import { api } from "./axios";

export const AvatarAPI = {
  getShop: () => api.get("/api/avatars/shop"),
  getMyAvatars: () => api.get("/api/avatars/my"),
  buy: (avatarId) => api.post("/api/avatars/buy", { avatarId }),
  equip: (avatarId) => api.post("/api/avatars/equip", { avatarId })
};
