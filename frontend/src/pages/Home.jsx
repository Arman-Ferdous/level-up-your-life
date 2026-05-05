import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { RewardsAPI } from "../api/rewards.api";
import { useAuth } from "../context/AuthContext";
import HomeSidebar from "../components/HomeSidebar";
import Badge from "../components/Badge";
import UpcomingTasksSidebar from "../components/UpcomingTasksSidebar";
import MoodHexPicker from "../components/MoodHexPicker";
import HabitStreakGrid from "../components/HabitStreakGrid";
import GlobalChallengeLeaderboard from "../components/GlobalChallengeLeaderboard";
import styles from "./Home.module.css";
import { TransactionAPI } from "../api/transaction.api";
import { ChallengeAPI } from "../api/challenge.api";
import AiGuide from "../components/AiGuide";
import ToastStack from "../components/ToastStack";
import AiChatLauncher from "../components/AiChatLauncher";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user, syncUser } = useAuth();
  const mainContentRef = useRef(null);
  const sectionRefs = useRef([]);
  const [todayMood, setTodayMood] = useState(null);
  const [moodLoading, setMoodLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [monthlyChallenge, setMonthlyChallenge] = useState(null);
  const [monthlyChallengeLoading, setMonthlyChallengeLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeSection, setActiveSection] = useState(0);

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

  useEffect(() => {
    if (!user?.isPremium) {
      setDailyStatus(null);
      return;
    }

    let active = true;
    setDailyLoading(true);

    RewardsAPI.getDailyStatus()
      .then((res) => {
        if (active) setDailyStatus(res.data);
      })
      .catch(() => {
        if (active) setDailyStatus(null);
      })
      .finally(() => {
        if (active) setDailyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.isPremium]);

  useEffect(() => {
    const root = mainContentRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const index = Number(visible.target.getAttribute("data-section-index"));
        if (!Number.isNaN(index)) {
          setActiveSection(index);
        }
      },
      {
        root,
        threshold: [0.35, 0.5, 0.65],
      },
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [monthlyChallengeLoading]);

  function scrollToSection(index) {
    const section = sectionRefs.current[index];
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(index);
  }

  const notify = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  async function handleClaimDailyBonus() {
    if (dailyClaiming) return;
    setDailyClaiming(true);
    try {
      const res = await RewardsAPI.claimDailyBonus();
      if (res.data?.success) {
        notify("+50 coins!", "success");
        if (user) {
          syncUser({ ...user, points: res.data.newBalance });
        }
        setDailyStatus({
          canClaim: false,
          alreadyClaimedToday: true,
          isPremium: true,
        });
      } else {
        setDailyStatus({
          canClaim: false,
          alreadyClaimedToday: true,
          isPremium: true,
        });
      }
    } catch {
      notify("Could not claim daily bonus.", "error");
    } finally {
      setDailyClaiming(false);
    }
  }

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

      <nav className={styles.sectionSelector} aria-label="Home sections">
        {[
          { label: "Hero", hint: "Start here" },
          { label: "AI", hint: "Assistant" },
          { label: "Challenge", hint: "Global" },
          { label: "Mood", hint: "Trends" },
          { label: "Badges", hint: "Progress" },
        ].map((item, index) => {
          const isActive = activeSection === index;

          return (
            <button
              key={item.label}
              type="button"
              className={`${styles.sectionSelectorItem} ${isActive ? styles.sectionSelectorItemActive : ""}`}
              onClick={() => scrollToSection(index)}
              aria-pressed={isActive}
              aria-label={item.label}
              title={item.label}
            >
              <span className={styles.sectionSelectorDot} aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <div className={styles.mainContent} ref={mainContentRef}>
        <section
          className={`${styles.section} ${styles.heroSection}`}
          ref={(node) => {
            sectionRefs.current[0] = node;
          }}
          data-section-index={0}
        >
          <div className={styles.sectionBody}>
            <div className={styles.heroSectionContent}>
              <div className={styles.heroCopy}>
                <p className={styles.greeting}>{getGreeting()},</p>
                <h1 className={styles.name}>
                  {user.selectedAvatar?.emoji} {firstName} 👋
                </h1>
                <p className={styles.sub}>
                  Today's focus lives here. Jump straight into Pomodoro, track
                  what matters, and keep the momentum moving.
                </p>

                <div className={styles.heroActions}>
                  <Link
                    to="/pomodoro"
                    className={styles.primaryAction}
                    aria-label="Start Pomodoro"
                  >
                    <span aria-hidden="true">🕒</span>
                  </Link>
                  <p className={styles.heroHint}>25-minute focus sprint</p>
                </div>

                {/* ── Badge spotlight — visible instantly on login ── */}
                <div className={styles.heroBadgeCard}>
                  <Badge streak={streak} />
                </div>
              </div>

              <div className={styles.tasksPanel}>
                <UpcomingTasksSidebar />
              </div>
            </div>
          </div>

          <div className={styles.sectionCue} aria-hidden="true">
            <span className={styles.sectionCueText}>AI Assistant below</span>
            <span className={styles.sectionCueArrow}>↓</span>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.aiSection}`}
          aria-labelledby="ai-assistant-title"
          ref={(node) => {
            sectionRefs.current[1] = node;
          }}
          data-section-index={1}
        >
          <div
            className={`${styles.sectionCue} ${styles.sectionCueAbove}`}
            aria-hidden="true"
          >
            <span className={styles.sectionCueArrow}>↑</span>
            <span className={styles.sectionCueText}>Hero above</span>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.sectionHeader}>
              <h2 id="ai-assistant-title" className={styles.sectionTitle}>
                AI Assistant
              </h2>
              <p className={styles.sectionSubtitle}>
                Get a personalized nudge, ask for help, or open the chat
                whenever you want the AI to think with you.
              </p>
            </div>

            <div className={styles.aiLayout}>
              <AiGuide todayMood={todayMood} surface="home" />

              <article className={styles.aiChatCard}>
                <div>
                  <p className={styles.cardEyebrow}>AI chat</p>
                  <h3 className={styles.cardTitle}>
                    Talk through your next move
                  </h3>
                </div>

                <p className={styles.aiChatText}>
                  Use the floating chat button anytime, or open the bot here to
                  get help with planning, motivation, mood, or tasks.
                </p>

                <button
                  type="button"
                  className={styles.aiChatButton}
                  onClick={() =>
                    window.dispatchEvent(new Event("open-ai-chat"))
                  }
                >
                  Open AI chat
                </button>

                <ul className={styles.aiPromptList}>
                  <li>Plan my day in 3 steps</li>
                  <li>Help me start one task</li>
                  <li>Motivate me when I feel stuck</li>
                </ul>
              </article>
            </div>
          </div>

          <div className={styles.sectionCue} aria-hidden="true">
            <span className={styles.sectionCueText}>
              Global Challenge below
            </span>
            <span className={styles.sectionCueArrow}>↓</span>
          </div>
          <AiChatLauncher />
        </section>

        {!monthlyChallengeLoading && monthlyChallenge && (
          <section
            className={`${styles.section} ${styles.challengeSection}`}
            ref={(node) => {
              sectionRefs.current[2] = node;
            }}
            data-section-index={2}
          >
            <div
              className={`${styles.sectionCue} ${styles.sectionCueAbove}`}
              aria-hidden="true"
            >
              <span className={styles.sectionCueArrow}>↑</span>
              <span className={styles.sectionCueText}>AI Assistant above</span>
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.challengeContainer}>
                <article className={styles.challengeCard}>
                  <div className={styles.challengeCardContent}>
                    <div className={styles.challengeCardTop}>
                      <div>
                        <p className={styles.challengeKicker}>Global Challenge</p>
                        <h2 className={styles.challengeTitle}>
                          {monthlyChallenge.title}
                        </h2>
                        <p className={styles.challengeDesc}>
                          {monthlyChallenge.description}
                        </p>
                      </div>
                    </div>

                    <div className={styles.challengeCardStats}>
                      <div className={styles.challengeStat}>
                        <span className={styles.challengeStatLabel}>
                          Participants
                        </span>
                        <span className={styles.challengeStatValue}>
                          {monthlyChallenge.participantCount}
                        </span>
                      </div>
                      <div className={styles.challengeStat}>
                        <span className={styles.challengeStatLabel}>
                          Completed
                        </span>
                        <span className={styles.challengeStatValue}>
                          {monthlyChallenge.completedCount}
                        </span>
                      </div>
                      {monthlyChallenge.winner && (
                        <div className={styles.challengeStat}>
                          <span className={styles.challengeStatLabel}>
                            Winner
                          </span>
                          <span className={styles.challengeStatWinner}>
                            👑 {monthlyChallenge.winner.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.challengeCardActions}>
                    {!monthlyChallenge.currentUserEntry ? (
                      <Link
                        to="/challenges"
                        className={styles.challengeActionBtn}
                      >
                        Register Now
                      </Link>
                    ) : !monthlyChallenge.currentUserEntry.completed ? (
                      <Link
                        to="/challenges"
                        className={styles.challengeActionBtn}
                      >
                        Complete Challenge
                      </Link>
                    ) : (
                      <span className={styles.challengeCompleted}>
                        ✓ You completed this!
                      </span>
                    )}
                  </div>
                </div>
              </article>
                <aside className={styles.leaderboardAside}>
                  <GlobalChallengeLeaderboard 
                    challengeId={monthlyChallenge._id}
                    title="Global Leaderboard"
                  />
                </aside>
              </div>
            </div>

            <div className={styles.sectionCue} aria-hidden="true">
              <span className={styles.sectionCueText}>
                Mood, expense, and calendar below
              </span>
              <span className={styles.sectionCueArrow}>↓</span>
            </div>
          </section>
        )}

        <section
          className={`${styles.section} ${styles.moodSection}`}
          ref={(node) => {
            sectionRefs.current[3] = node;
          }}
          data-section-index={3}
        >
          <div
            className={`${styles.sectionCue} ${styles.sectionCueAbove}`}
            aria-hidden="true"
          >
            <span className={styles.sectionCueArrow}>↑</span>
            <span className={styles.sectionCueText}>
              Global Challenge above
            </span>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Mood, expense, and calendar
              </h2>
              <p className={styles.sectionSubtitle}>
                Check how today feels, then jump to money tracking or the
                heatmap calendar with one click.
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
                    <MoodHexPicker
                      initial={todayMood}
                      onSaved={(entry) => setTodayMood(entry)}
                    />

                    <div className={styles.moodHintRow}>
                      <p className={styles.moodNote}>
                        Tap one to set today's mood. You can edit entries in the
                        Mood Journal.
                      </p>
                    </div>
                  </>
                )}
              </article>

              <div className={styles.quickLinks}>
                {user?.isPremium ? (
                  <article className={styles.bonusCard}>
                    <div>
                      <p className={styles.cardEyebrow}>Daily Bonus</p>
                      <h3 className={styles.cardTitle}>Claim 50 coins</h3>
                      <p className={styles.bonusText}>
                        Premium perk for checking in each day.
                      </p>
                    </div>
                    {dailyLoading ? (
                      <span className={styles.bonusStatus}>Checking...</span>
                    ) : dailyStatus?.alreadyClaimedToday ? (
                      <button
                        type="button"
                        className={styles.bonusButton}
                        disabled
                      >
                        ✓ Claimed — Come back tomorrow
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.bonusButton}
                        onClick={handleClaimDailyBonus}
                        disabled={dailyClaiming}
                      >
                        {dailyClaiming
                          ? "Claiming..."
                          : "Claim Daily Bonus 🎁 (+50 coins)"}
                      </button>
                    )}
                  </article>
                ) : (
                  <article
                    className={`${styles.bonusCard} ${styles.bonusLocked}`}
                  >
                    <div>
                      <p className={styles.cardEyebrow}>Daily Bonus</p>
                      <h3 className={styles.cardTitle}>
                        🔒 Daily Bonus — Premium perk
                      </h3>
                      <p className={styles.bonusText}>
                        Upgrade to unlock 50 coins every day.
                      </p>
                    </div>
                    <Link to="/subscription" className={styles.bonusLink}>
                      Upgrade
                    </Link>
                  </article>
                )}

                <div className={styles.balanceCard}>
                  <div>
                    <p className={styles.cardEyebrow}>Current balance</p>
                    <h2 className={styles.balanceValue}>
                      {balanceLoading
                        ? "—"
                        : balance >= 0
                          ? `$${balance.toFixed(2)}`
                          : `-$${Math.abs(balance).toFixed(2)}`}
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
                    <p>
                      See task pressure, expenses, and mood trends across the
                      month.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.sectionCue} aria-hidden="true">
            <span className={styles.sectionCueText}>
              Badges collected below
            </span>
            <span className={styles.sectionCueArrow}>↓</span>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.badgeSection}`}
          ref={(node) => {
            sectionRefs.current[4] = node;
          }}
          data-section-index={4}
        >
          <div
            className={`${styles.sectionCue} ${styles.sectionCueAbove}`}
            aria-hidden="true"
          >
            <span className={styles.sectionCueArrow}>↑</span>
            <span className={styles.sectionCueText}>
              Mood, expense, and calendar above
            </span>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.sectionHeaderSplit}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Badges collected</h2>
                <p className={styles.sectionSubtitle}>
                  Your streak unlocks a new badge track as you build
                  consistency.
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
                        <p>
                          {unlocked
                            ? "Collected"
                            : `Unlock at ${badge.unlockAt} days`}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className={styles.habitsSection}>
                <HabitStreakGrid showHeader={false} />
              </div>
            </div>
          </div>
        </section>
      </div>
      <ToastStack toasts={toasts} onClose={dismissToast} />
    </main>
  );
}
