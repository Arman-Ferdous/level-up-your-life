import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PaymentModal from "../components/PaymentModal";
import styles from "./SubscriptionPage.module.css";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const isPremium = Boolean(user?.isPremium);

  const formattedExpiry = useMemo(() => {
    if (!user?.premiumExpiresAt) return "";
    const date = new Date(user.premiumExpiresAt);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }, [user?.premiumExpiresAt]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>Subscription</p>
          <h1 className={styles.title}>Premium</h1>
          <p className={styles.subtitle}>Your LevelUp perks live here.</p>
        </header>

        {isPremium ? (
          <section className={styles.activeCard}>
            <h2 className={styles.activeTitle}>Premium Active ✓</h2>
            {formattedExpiry && (
              <p className={styles.expiry}>Expires on: {formattedExpiry}</p>
            )}
            <ul className={styles.perkList}>
              <li>Unlimited AI chat</li>
              <li>Daily login bonus (+50 coins)</li>
              <li>Exclusive premium avatars</li>
              <li>Premium badge on leaderboards</li>
            </ul>
            <Link to="/" className={styles.backLink}>
              Back to dashboard
            </Link>
          </section>
        ) : (
          <section className={styles.planCard}>
            <div className={styles.planHeader}>
              <h2>Premium — ৳499/month</h2>
              <span className={styles.planBadge}>Best Value</span>
            </div>
            <ul className={styles.perkList}>
              <li>✓ Unlimited AI chat</li>
              <li>✓ Daily login bonus (50 coins)</li>
              <li>✓ Exclusive premium avatars</li>
              <li>✓ Premium badge on leaderboard</li>
            </ul>
            <button
              type="button"
              className={styles.subscribeButton}
              onClick={() => setShowPayment(true)}
            >
              Subscribe Now — ৳499/month
            </button>
          </section>
        )}
      </div>

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
    </main>
  );
}
