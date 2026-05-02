import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./AiGuide.module.css";
import { TaskAPI } from "../api/task.api";
import { ChallengeAPI } from "../api/challenge.api";
import { useAuth } from "../context/AuthContext";

export default function AiGuide({ todayMood }) {
  const { user } = useAuth();
  const [incompleteTasks, setIncompleteTasks] = useState(0);
  const [monthly, setMonthly] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    TaskAPI.getMy({ status: "incomplete" })
      .then((res) => {
        if (!mounted) return;
        setIncompleteTasks(res.data.tasks?.length || 0);
      })
      .catch(() => setIncompleteTasks(0));

    ChallengeAPI.getMonthly()
      .then((res) => {
        if (!mounted) return;
        setMonthly((res.data.monthlyChallenges || [])[0] || null);
      })
      .catch(() => {});

    return () => (mounted = false);
  }, []);

  useEffect(() => {
    // Very small heuristic 'AI' to craft suggestions
    const moodTag = todayMood?.tag || "neutral";
    const lowPoints = (user?.points ?? 0) < 50;

    const lines = [];
    if (moodTag === "sad" || moodTag === "crying" || moodTag === "anxious") {
      lines.push("I can see you're having a tough moment — that's okay.");
      lines.push("Small wins help: try a 10-minute task or a quick mood check.");
    }

    if (incompleteTasks > 0) {
      lines.push(`You have ${incompleteTasks} incomplete task${incompleteTasks>1?"s":""}. Finishing one gives momentum.`);
    }

    if (monthly) {
      lines.push(`There's a Global Challenge: ${monthly.title}. Join to earn points and compete!`);
    }

    if (lowPoints) {
      lines.push("You're low on points — participate in challenges or complete tasks to earn more.");
    } else {
      lines.push("You're doing well — keep the streak going and collect more rewards!");
    }

    // Pick up to 3 message lines
    setMessage(lines.slice(0, 3).join(" "));
  }, [todayMood, incompleteTasks, monthly, user]);

  if (!user) return null;

  return (
    <div className={styles.card} role="region" aria-label="AI Guide">
      <div className={styles.header}>
        <h3 className={styles.title}>AI Guide 🤖</h3>
        <p className={styles.sub}>Motivation & quick actions tailored for you</p>
      </div>

      <div className={styles.body}>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          {incompleteTasks > 0 && (
            <Link to="/tasks" className={styles.btnPrimary}>Complete a task</Link>
          )}

          {monthly && (
            <Link to="/challenges" className={styles.btn}>Join monthly challenge</Link>
          )}

          <Link to="/avatar-shop" className={styles.btn}>Visit Avatar Shop</Link>
        </div>

        <div className={styles.footer}>
          <small>Tip: small actions add up. I’ll cheer you on! 🎉</small>
        </div>
      </div>
    </div>
  );
}
