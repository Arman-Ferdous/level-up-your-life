import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/auth.api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function bootstrap() {
    try {
      if (localStorage.getItem("accessToken")) {
        // Timeout after 8 s so a dead backend never freezes the UI on "Loading..."
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("auth timeout")), 8000)
        );
        const res = await Promise.race([AuthAPI.me(), timeout]);
        setUser(res.data.user);
      }
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function login(email, password) {
    const res = await AuthAPI.login({ email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    setUser(res.data.user);
  }

  async function register(name, email, password) {
    const res = await AuthAPI.register({ name, email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    setUser(res.data.user);
  }

  async function logout() {
    try {
      await AuthAPI.logout();
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}