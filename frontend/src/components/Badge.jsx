import styles from './Badge.module.css';

const BADGE_LEVELS = [
  {
    key: 'beginner',
    tier: 'Beginner',
    name: 'First Step',
    className: 'badge-beginner',
    icon: '🌱',
    minDays: 1,
    unlockAt: 1
  },
  {
    key: 'bronze',
    tier: 'Bronze',
    name: 'Starter Spark',
    className: 'badge-bronze',
    icon: '🔥',
    minDays: 7,
    unlockAt: 7
  },
  {
    key: 'silver',
    tier: 'Silver',
    name: 'Consistency Builder',
    className: 'badge-silver',
    icon: '⚡',
    minDays: 14,
    unlockAt: 14
  },
  {
    key: 'gold',
    tier: 'Gold',
    name: 'Unstoppable Force',
    className: 'badge-gold',
    icon: '👑',
    minDays: 30,
    unlockAt: 30
  }
];

/**
 * Get badge details based on streak count
 * @param {number} streak - Number of consecutive days
 * @returns {Object} - { name, className, icon }
 */
export function getBadge(streak) {
  const safeStreak = Math.max(0, Number(streak) || 0);

  if (safeStreak >= 30) return BADGE_LEVELS[3];
  if (safeStreak >= 14) return BADGE_LEVELS[2];
  if (safeStreak >= 7) return BADGE_LEVELS[1];
  return BADGE_LEVELS[0];
}

/**
 * Badge Component - Displays user achievement based on streak
 * @param {number} streak - Number of consecutive days
 * @returns {JSX.Element}
 */
export function Badge({ streak = 0 }) {
  const safeStreak = Math.max(0, Number(streak) || 0);
  const badge = getBadge(safeStreak);

  return (
    <div className={styles.badgeContainer}>
      <div className={`${styles.badge} ${styles[badge.className]}`}>
        <span className={styles.icon}>{badge.icon}</span>
      </div>
      <p className={styles.badgeName}>{badge.name}</p>
      <p className={styles.streak}>{safeStreak} day streak</p>
    </div>
  );
}

export default Badge;
