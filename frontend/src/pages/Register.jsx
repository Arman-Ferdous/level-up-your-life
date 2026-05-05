import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthMarquee from "./AuthMarquee";
import styles from "./AuthPage.module.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await register(name, email, password);
      navigate("/");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Signup failed");
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

        <h2 className={styles.title}>Register</h2>

        <form onSubmit={onSubmit} className={styles.form}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          {err && <div className={styles.error}>{err}</div>}
          <button className={styles.button}>
            Create account
          </button>
        </form>
        <p className={styles.footerText}>
          Have an account? <Link to="/login" className={styles.footerLink}>Login</Link>
        </p>
      </section>
    </main>
  );
}
