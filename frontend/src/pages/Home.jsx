import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  if (!user) return <div style={{ margin: 40 }}>Not logged in.</div>;

  return (
    <div style={{ margin: 40 }}>
      <h2>Home</h2>
      <p>
        Logged in as <b>{user.name}</b> ({user.email})
      </p>
      <button onClick={logout} style={{ padding: 10 }}>
        Logout
      </button>
    </div>
  );
}