import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomeSidebar from "../components/HomeSidebar";
import styles from "./Home.module.css";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useAuth();

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || user.name;

  return (
    <main className={styles.page}>
      <div className={styles.mainContent}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.greeting}>{getGreeting()},</p>
            <h1 className={styles.name}>{firstName} 👋</h1>
            <p className={styles.sub}>
              Here's your daily overview. Keep leveling up!
            </p>
          </div>
        </section>

        <Link to="/pomodoro" className={styles.pomodoroBanner}>
          <div>
            <p className={styles.pomodoroKicker}>Focus Sprint</p>
            <h3 className={styles.pomodoroTitle}>Start a 25-minute Pomodoro</h3>
            <p className={styles.pomodoroDesc}>One click to enter focus mode and run your timer.</p>
          </div>
          <span className={styles.pomodoroCta}>Start Now</span>
        </Link>

        {/* ── Feature cards ── */}
        <section className={styles.cards}>
          <Link to="/mood" className={styles.card}>
            <span className={styles.cardIcon}>🧠</span>
            <h3 className={styles.cardTitle}>Mood Tracker</h3>
            <p className={styles.cardDesc}>Log how you feel and review your 7-day mood history.</p>
          </Link>

          <Link to="/expense-tracker" className={styles.card}>
            <span className={styles.cardIcon}>💰</span>
            <h3 className={styles.cardTitle}>Expense Tracker</h3>
            <p className={styles.cardDesc}>Track income and expenses with charts and monthly summaries.</p>
          </Link>

          <Link to="/tasks" className={styles.card}>
            <span className={styles.cardIcon}>✓</span>
            <h3 className={styles.cardTitle}>Task Manager</h3>
            <p className={styles.cardDesc}>Manage habits, deadlines, and one-time tasks efficiently.</p>
          </Link>
        </section>
      </div>

      {/* ── Sidebar ── */}
      <HomeSidebar />
    </main>
  );
}