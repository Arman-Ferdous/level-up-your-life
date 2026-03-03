import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true
});

// Attach access token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 once
let isRefreshing = false;
let queue = [];

function resolveQueue(error, token = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error?.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject
        });
      });
    }

    isRefreshing = true;
    try {
      const r = await api.post("/api/auth/refresh");
      const newToken = r.data.accessToken;
      localStorage.setItem("accessToken", newToken);
      resolveQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      resolveQueue(e, null);
      localStorage.removeItem("accessToken");
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);