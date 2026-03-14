import styles from "./ExpenseTrackerComponents.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Transactions</h2>
      {transactions.length === 0 ? (
        <p className={styles.emptyText}>No transactions found for this month.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <span
                      className={`${styles.typeBadge} ${
                        transaction.type === "income" ? styles.incomeBadge : styles.expenseBadge
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td>{transaction.category}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td className={styles.noteCell}>{transaction.note || "-"}</td>
                  <td>
                    <div className={styles.actionRow}>
                      <button className={styles.iconBtn} onClick={() => onEdit(transaction)}>
                        Edit
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => onDelete(transaction._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
