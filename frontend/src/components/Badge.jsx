import styles from './Badge.module.css';
import { useMemo } from 'react';

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

  const lockedBadges = useMemo(
    () => BADGE_LEVELS.filter((level) => safeStreak < level.minDays),
    [safeStreak]
  );

  return (
    <div className={styles.badgeContainer}>
      <div className={`${styles.badge} ${styles[badge.className]}`}>
        <span className={styles.icon}>{badge.icon}</span>
      </div>
      <p className={styles.badgeName}>{badge.name}</p>
      <p className={styles.streak}>{safeStreak} day streak</p>

      <div className={styles.lockedHoverArea}>
        <button type="button" className={styles.lockedTrigger}>
          <span aria-hidden="true">🔒</span> Locked badges
        </button>

        <div className={styles.lockedPopover}>
          <h4 className={styles.lockedTitle}>Upcoming Badges</h4>
          {lockedBadges.length === 0 ? (
            <p className={styles.allUnlocked}>All badges unlocked. Amazing work!</p>
          ) : (
            <ul className={styles.lockedList}>
              {lockedBadges.map((level) => {
                const daysLeft = Math.max(0, level.unlockAt - safeStreak);
                return (
                  <li key={level.key} className={styles.lockedItem}>
                    <span className={styles.lockedIcon}>{level.icon}</span>
                    <div>
                      <p className={styles.lockedName}>{level.name}</p>
                      <p className={styles.unlockInfo}>
                        Unlock at {level.unlockAt} days ({daysLeft} day{daysLeft === 1 ? '' : 's'} left)
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Badge;
