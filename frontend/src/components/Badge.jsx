import styles from './Badge.module.css';

/**
 * Get badge details based on streak count
 * @param {number} streak - Number of consecutive days
 * @returns {Object} - { name, className, icon }
 */
export function getBadge(streak) {
  if (streak >= 30) {
    return {
      name: 'Unstoppable Force',
      className: 'badge-gold',
      icon: '👑'
    };
  } else if (streak >= 14) {
    return {
      name: 'Consistency Builder',
      className: 'badge-silver',
      icon: '⚡'
    };
  } else if (streak >= 7) {
    return {
      name: 'Starter Spark',
      className: 'badge-bronze',
      icon: '🔥'
    };
  } else {
    return {
      name: 'First Step',
      className: 'badge-beginner',
      icon: '🌱'
    };
  }
}

/**
 * Badge Component - Displays user achievement based on streak
 * @param {number} streak - Number of consecutive days
 * @returns {JSX.Element}
 */
export function Badge({ streak = 0 }) {
  const badge = getBadge(streak);

  return (
    <div className={styles.badgeContainer}>
      <div className={`${styles.badge} ${styles[badge.className]}`}>
        <span className={styles.icon}>{badge.icon}</span>
      </div>
      <p className={styles.badgeName}>{badge.name}</p>
      <p className={styles.streak}>{streak} day streak</p>
    </div>
  );
}

export default Badge;
