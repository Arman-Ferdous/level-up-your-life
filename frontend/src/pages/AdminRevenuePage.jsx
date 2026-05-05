import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionAPI } from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminRevenuePage.module.css";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function AdminRevenuePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalBalance: 0, totalPayments: 0, recentPayments: [] });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    SubscriptionAPI.getAdminRevenue()
      .then((res) => {
        if (!active) return;
        setSummary(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || "Failed to load revenue");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const monthTotal = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return (summary.recentPayments || []).reduce((sum, payment) => {
      const date = new Date(payment.createdAt);
      if (date.getMonth() === month && date.getFullYear() === year) {
        return sum + (payment.amount || 0);
      }
      return sum;
    }, 0);
  }, [summary.recentPayments]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Admin: Revenue</h1>
        <div className={styles.headerActions}>
          <button className={styles.logoutBtn} onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading revenue...</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>💰 Total Balance</p>
              <h2 className={styles.statValue}>৳{summary.totalBalance ?? 0}</h2>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>📊 Total Payments</p>
              <h2 className={styles.statValue}>{summary.totalPayments ?? 0}</h2>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>📅 This Month</p>
              <h2 className={styles.statValue}>৳{monthTotal}</h2>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Amount</th>
                  <th>Card</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(summary.recentPayments || []).map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.userId?.name || payment.userName || "Unknown"}</td>
                    <td>৳{payment.amount}</td>
                    <td>**** **** **** {payment.cardLast4 || "0000"}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
