import { useCallback, useEffect, useMemo, useState } from "react";
import { TransactionAPI } from "../api/transaction.api";
import SummaryCards from "../components/expense/SummaryCards";
import TransactionForm from "../components/expense/TransactionForm";
import ExpenseCharts from "../components/expense/ExpenseCharts";
import TransactionTable from "../components/expense/TransactionTable";
import styles from "./ExpenseTrackerPage.module.css";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const now = new Date();
const DEFAULT_MONTH = now.getMonth() + 1;
const DEFAULT_YEAR = now.getFullYear();

export default function ExpenseTrackerPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ summary: { income: 0, expense: 0, balance: 0 }, categoryBreakdown: [], dailySeries: [] });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = DEFAULT_YEAR - 5; y <= DEFAULT_YEAR + 1; y += 1) years.push(y);
    return years.reverse();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes, statsRes] = await Promise.all([
        TransactionAPI.list({ month, year }),
        TransactionAPI.stats({ month, year }),
      ]);
      setTransactions(listRes.data.transactions || []);
      setStats({
        summary: statsRes.data.summary || { income: 0, expense: 0, balance: 0 },
        categoryBreakdown: statsRes.data.categoryBreakdown || [],
        dailySeries: statsRes.data.dailySeries || [],
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError("");
    try {
      if (editingTransaction) {
        await TransactionAPI.update(editingTransaction._id, payload);
      } else {
        await TransactionAPI.create(payload);
      }
      setEditingTransaction(null);
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) return;

    setError("");
    try {
      await TransactionAPI.remove(id);
      if (editingTransaction?._id === id) {
        setEditingTransaction(null);
      }
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not delete transaction.");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Expense Tracker</p>
          <h1 className={styles.title}>Monthly Income & Expense Dashboard</h1>
          <p className={styles.subtitle}>
            Add transactions, analyze spending patterns, and stay in control of your monthly balance.
          </p>
        </div>

        <div className={styles.filters}>
          <label className={styles.filterField}>
            <span>Month</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Year</span>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}
      {loading ? (
        <p className={styles.loading}>Loading monthly data...</p>
      ) : (
        <section className={styles.stack}>
          <SummaryCards summary={stats.summary} />
          <TransactionForm
            editingTransaction={editingTransaction}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingTransaction(null)}
          />
          <ExpenseCharts categoryBreakdown={stats.categoryBreakdown} dailySeries={stats.dailySeries} />
          <TransactionTable
            transactions={transactions}
            onEdit={setEditingTransaction}
            onDelete={handleDelete}
          />
        </section>
      )}
    </main>
  );
}
