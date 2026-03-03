import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/auth.api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function bootstrap() {
    try {
      // If access token exists, try /me; refresh will happen automatically on 401
      if (localStorage.getItem("accessToken")) {
        const res = await AuthAPI.me();
        setUser(res.data.user);
      }
    } catch {
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