import styles from "./Badge.module.css";

const BADGE_LEVELS = [
  {
    key: "beginner",
    tier: "Beginner",
    name: "First Step",
    icon: "🌱",
    unlockAt: 1,
    nextAt: 7,
    color: "#10b981",
    glow: "rgba(16,185,129,0.55)",
    bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    key: "bronze",
    tier: "Bronze",
    name: "Starter Spark",
    icon: "🔥",
    unlockAt: 7,
    nextAt: 14,
    color: "#f97316",
    glow: "rgba(249,115,22,0.55)",
    bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  },
  {
    key: "silver",
    tier: "Silver",
    name: "Consistency Builder",
    icon: "⚡",
    unlockAt: 14,
    nextAt: 30,
    color: "#6366f1",
    glow: "rgba(99,102,241,0.55)",
    bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  },
  {
    key: "gold",
    tier: "Gold",
    name: "Unstoppable Force",
    icon: "👑",
    unlockAt: 30,
    nextAt: null,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.65)",
    bg: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  },
];

export function getBadge(streak) {
  const s = Math.max(0, Number(streak) || 0);
  if (s >= 30) return BADGE_LEVELS[3];
  if (s >= 14) return BADGE_LEVELS[2];
  if (s >= 7) return BADGE_LEVELS[1];
  return BADGE_LEVELS[0];
}

export function Badge({ streak = 0 }) {
  const s = Math.max(0, Number(streak) || 0);
  const badge = getBadge(s);
  const isMaxed = badge.nextAt === null;
  const progress = isMaxed
    ? 100
    : Math.min(
        100,
        Math.round(
          ((s - badge.unlockAt) / (badge.nextAt - badge.unlockAt)) * 100,
        ),
      );

  return (
    <div className={styles.wrap}>
      {/* Outer glow ring */}
      <div
        className={styles.glowRing}
        style={{ "--glow": badge.glow, "--color": badge.color }}
      />

      {/* Badge circle */}
      <div
        className={styles.circle}
        style={{
          background: badge.bg,
          boxShadow: `0 0 0 6px ${badge.color}33, 0 20px 48px ${badge.glow}`,
        }}
      >
        <span className={styles.icon}>{badge.icon}</span>
        {/* Shimmer sweep */}
        <span className={styles.shimmer} />
      </div>

      {/* Tier pill */}
      <span
        className={styles.tierPill}
        style={{ background: badge.bg, boxShadow: `0 4px 14px ${badge.glow}` }}
      >
        {badge.tier}
      </span>

      {/* Name & streak */}
      <p className={styles.name}>{badge.name}</p>
      <p className={styles.streak}>
        <span className={styles.streakNum}>{s}</span>
        <span className={styles.streakLabel}> day streak</span>
      </p>

      {/* Progress bar to next badge */}
      {!isMaxed && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${progress}%`,
                background: badge.bg,
                boxShadow: `0 0 8px ${badge.glow}`,
              }}
            />
          </div>
          <p className={styles.progressLabel}>
            {badge.nextAt - s} days to next badge
          </p>
        </div>
      )}

      {isMaxed && <p className={styles.maxed}>🏆 Maximum badge achieved!</p>}
    </div>
  );
}

export default Badge;
