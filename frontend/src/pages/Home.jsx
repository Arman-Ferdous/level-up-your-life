import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import HomeSidebar from "../components/HomeSidebar";
import Badge from "../components/Badge";
import UpcomingTasksSidebar from "../components/UpcomingTasksSidebar";
import MoodHexPicker from "../components/MoodHexPicker";
import HabitStreakGrid from "../components/HabitStreakGrid";
import styles from "./Home.module.css";
import { TransactionAPI } from "../api/transaction.api";
import { ChallengeAPI } from "../api/challenge.api";
import AiGuide from "../components/AiGuide";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useAuth();
  const [todayMood, setTodayMood] = useState(null);
  const [moodLoading, setMoodLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [monthlyChallenge, setMonthlyChallenge] = useState(null);
  const [monthlyChallengeLoading, setMonthlyChallengeLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    api
      .get("/api/mood/today", { params: { date } })
      .then((res) => setTodayMood(res.data.entry))
      .catch(() => setTodayMood(null))
      .finally(() => setMoodLoading(false));
  }, []);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    setBalanceLoading(true);

    TransactionAPI.stats({ year, month })
      .then((res) => {
        setBalance(res.data.summary?.balance ?? 0);
      })
      .catch(() => setBalance(0))
      .finally(() => setBalanceLoading(false));
  }, []);

  useEffect(() => {
    ChallengeAPI.getMonthly()
      .then((res) => {
        const challenges = res.data.monthlyChallenges || [];
        if (challenges.length > 0) {
          setMonthlyChallenge(challenges[0]);
        }
      })
      .catch(() => setMonthlyChallenge(null))
      .finally(() => setMonthlyChallengeLoading(false));
  }, []);

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || user.name;
  const badgeMilestones = [
    { key: "beginner", icon: "🌱", name: "First Step", unlockAt: 1 },
    { key: "bronze", icon: "🔥", name: "Starter Spark", unlockAt: 7 },
    { key: "silver", icon: "⚡", name: "Consistency Builder", unlockAt: 14 },
    { key: "gold", icon: "👑", name: "Unstoppable Force", unlockAt: 30 },
  ];
  const streak = Math.max(0, Number(user.streak) || 0);

  return (
    <main className={styles.page}>
      <HomeSidebar />

      <div className={styles.mainContent}>
        <section className={`${styles.section} ${styles.heroSection}`}>
          <div className={styles.heroCopy}>
            <p className={styles.greeting}>{getGreeting()},</p>
            <h1 className={styles.name}>
              {user.selectedAvatar?.emoji} {firstName} 👋
            </h1>
            <p className={styles.sub}>
              Today's focus lives here. Jump straight into Pomodoro, track what matters, and keep the momentum moving.
            </p>

            <div className={styles.heroActions}>
              <Link to="/pomodoro" className={styles.primaryAction} aria-label="Start Pomodoro">
                <span aria-hidden="true">🕒</span>
              </Link>
              <p className={styles.heroHint}>25-minute focus sprint</p>
            </div>
          </div>

          <div className={styles.tasksPanel}>
            <UpcomingTasksSidebar />
          </div>
        </section>

        {/* AI Guide */}
        <AiGuide todayMood={todayMood} />

        {!monthlyChallengeLoading && monthlyChallenge && (
          <section className={`${styles.section} ${styles.challengeSection}`}>
            <article className={styles.challengeCard}>
              <div className={styles.challengeCardContent}>
                <div className={styles.challengeCardTop}>
                  <div>
                    <p className={styles.challengeKicker}>Global Challenge</p>
                    <h2 className={styles.challengeTitle}>{monthlyChallenge.title}</h2>
                    <p className={styles.challengeDesc}>{monthlyChallenge.description}</p>
                  </div>
                </div>

                <div className={styles.challengeCardStats}>
                  <div className={styles.challengeStat}>
                    <span className={styles.challengeStatLabel}>Participants</span>
                    <span className={styles.challengeStatValue}>{monthlyChallenge.participantCount}</span>
                  </div>
                  <div className={styles.challengeStat}>
                    <span className={styles.challengeStatLabel}>Completed</span>
                    <span className={styles.challengeStatValue}>{monthlyChallenge.completedCount}</span>
                  </div>
                  {monthlyChallenge.winner && (
                    <div className={styles.challengeStat}>
                      <span className={styles.challengeStatLabel}>Winner</span>
                      <span className={styles.challengeStatWinner}>👑 {monthlyChallenge.winner.name}</span>
                    </div>
                  )}
                </div>

                <div className={styles.challengeCardActions}>
                  {!monthlyChallenge.currentUserEntry ? (
                    <Link to="/challenges" className={styles.challengeActionBtn}>
                      Register Now
                    </Link>
                  ) : !monthlyChallenge.currentUserEntry.completed ? (
                    <Link to="/challenges" className={styles.challengeActionBtn}>
                      Complete Challenge
                    </Link>
                  ) : (
                    <span className={styles.challengeCompleted}>✓ You completed this!</span>
                  )}
                </div>
              </div>
            </article>
          </section>
        )}

        <section className={`${styles.section} ${styles.moodSection}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Section 02</p>
            <h2 className={styles.sectionTitle}>Mood, expense, and calendar</h2>
            <p className={styles.sectionSubtitle}>
              Check how today feels, then jump to money tracking or the heatmap calendar with one click.
            </p>
          </div>

          <div className={styles.secondaryGrid}>
            <article className={styles.moodCard}>
              <div className={styles.cardHeaderRow}>
                <div>
                  <p className={styles.cardEyebrow}>Today's mood</p>
                  <h3 className={styles.cardTitle}>Log how you feel</h3>
                </div>
                <Link to="/mood" className={styles.cardButton}>
                  Mood Journal
                </Link>
              </div>

              {moodLoading ? (
                <p className={styles.loadingText}>Loading mood...</p>
              ) : (
                <>
                  <MoodHexPicker initial={todayMood} onSaved={(entry) => setTodayMood(entry)} />

                  <div className={styles.moodHintRow}>
                    <p className={styles.moodNote}>Tap one to set today's mood. You can edit entries in the Mood Journal.</p>
                  </div>
                </>
              )}
            </article>

            <div className={styles.quickLinks}>
              <div className={styles.balanceCard}>
                <div>
                  <p className={styles.cardEyebrow}>Current balance</p>
                  <h2 className={styles.balanceValue}>
                    {balanceLoading ? "—" : balance >= 0 ? `$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}
                  </h2>
                  <p className={styles.balanceSub}>This month</p>
                </div>

                <div>
                  <Link to="/expense-tracker" className={styles.cardButton}>
                    Update in Expense Manager
                  </Link>
                </div>
              </div>

              <Link to="/calendar" className={styles.quickLinkCard}>
                <span className={styles.quickLinkIcon}>📅</span>
                <div>
                  <h3>Heatmap Calendar</h3>
                  <p>See task pressure, expenses, and mood trends across the month.</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.badgeSection}`}>
          <div className={styles.sectionHeaderSplit}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Section 03</p>
              <h2 className={styles.sectionTitle}>Badges collected</h2>
              <p className={styles.sectionSubtitle}>
                Your streak unlocks a new badge track as you build consistency.
              </p>
            </div>

            <div className={styles.sectionHeaderRight}>
              <h2 className={styles.sectionTitle}>Habit consistency</h2>
              <p className={styles.sectionSubtitle}>Last 12 weeks</p>
            </div>
          </div>

          <div className={styles.badgeLayout}>
            <div className={styles.badgesSection}>
              <div className={styles.badgeSpotlight}>
                <Badge streak={streak} />
              </div>

              <div className={styles.badgeGrid}>
                {badgeMilestones.map((badge) => {
                  const unlocked = streak >= badge.unlockAt;

                  return (
                    <article
                      key={badge.key}
                      className={`${styles.badgeTile} ${unlocked ? styles.badgeTileUnlocked : ""} badge-${badge.key}`}
                    >
                      <div className={styles.badgeTileIcon}>{badge.icon}</div>
                      <h3>{badge.name}</h3>
                      <p>{unlocked ? "Collected" : `Unlock at ${badge.unlockAt} days`}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className={styles.habitsSection}>
              <HabitStreakGrid showHeader={false} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}