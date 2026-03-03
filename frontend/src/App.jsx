import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

export default function App() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState("login");

  if (loading) return <div style={{ margin: 40 }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, margin: 20 }}>
        <button onClick={() => setMode("login")}>Login</button>
        <button onClick={() => setMode("register")}>Register</button>
        <button onClick={() => setMode("home")}>Home</button>
      </div>

      {mode === "login" && !user && <Login />}
      {mode === "register" && !user && <Register />}
      {mode === "home" && <Home />}
      {(mode === "login" || mode === "register") && user && <Home />}
    </div>
  );
}