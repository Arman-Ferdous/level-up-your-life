import styles from "./ExpenseTrackerComponents.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function SummaryCards({ summary }) {
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const balance = summary?.balance || 0;

  return (
    <section className={styles.summaryGrid}>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Monthly Income</p>
        <h3 className={`${styles.cardValue} ${styles.income}`}>{formatCurrency(income)}</h3>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Monthly Expense</p>
        <h3 className={`${styles.cardValue} ${styles.expense}`}>{formatCurrency(expense)}</h3>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.cardLabel}>Balance</p>
        <h3 className={`${styles.cardValue} ${balance >= 0 ? styles.income : styles.expense}`}>
          {formatCurrency(balance)}
        </h3>
      </article>
    </section>
  );
}
