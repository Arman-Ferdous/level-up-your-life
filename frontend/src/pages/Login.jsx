import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthMarquee from "./AuthMarquee";
import styles from "./AuthPage.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    }
  }

  return (
    <main className={styles.page}>
      <AuthMarquee />

      <section className={styles.card}>
        <Link to="/" className={styles.brand} aria-label="LevelUp home">
          <span className={styles.brandMark}>L</span>
          <span className={styles.brandText}>LevelUp</span>
        </Link>

        <h2 className={styles.title}>Login</h2>

        <form onSubmit={onSubmit} className={styles.form}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          {err && <div className={styles.error}>{err}</div>}
          <button className={styles.button}>
            Login
          </button>
        </form>
        <p className={styles.footerText}>
          No account? <Link to="/register" className={styles.footerLink}>Register</Link>
        </p>
      </section>
    </main>
  );
}
