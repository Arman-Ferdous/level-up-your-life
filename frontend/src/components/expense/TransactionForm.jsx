import { useEffect, useMemo, useState } from "react";
import styles from "./ExpenseTrackerComponents.module.css";

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Business",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Travel",
  "Other Expense",
];

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function getDefaultState() {
  return {
    type: "expense",
    category: "Food",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  };
}

export default function TransactionForm({ editingTransaction, submitting, onSubmit, onCancelEdit }) {
  const [form, setForm] = useState(getDefaultState());

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        type: editingTransaction.type,
        category: editingTransaction.category,
        amount: String(editingTransaction.amount),
        note: editingTransaction.note || "",
        date: toInputDate(editingTransaction.date),
      });
      return;
    }
    setForm(getDefaultState());
  }, [editingTransaction]);

  const categoryOptions = useMemo(() => {
    return form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }, [form.type]);

  useEffect(() => {
    if (!categoryOptions.includes(form.category)) {
      setForm((prev) => ({ ...prev, category: categoryOptions[0] }));
    }
  }, [categoryOptions, form.category]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      note: form.note.trim(),
      date: form.date,
    });

    if (!editingTransaction) {
      setForm(getDefaultState());
    }
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <label className={styles.field}>
          <span>Type</span>
          <select value={form.type} onChange={(e) => updateField("type", e.target.value)} required>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Category</span>
          <select value={form.category} onChange={(e) => updateField("category", e.target.value)} required>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Amount</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="0.00"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            required
          />
        </label>

        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Note</span>
          <textarea
            rows="3"
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            placeholder="Optional note"
          />
        </label>

        <div className={styles.formActions}>
          {editingTransaction && (
            <button type="button" className={styles.secondaryBtn} onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}
          <button type="submit" className={styles.primaryBtn} disabled={submitting}>
            {submitting ? "Saving..." : editingTransaction ? "Update Transaction" : "Add Transaction"}
          </button>
        </div>
      </form>
    </section>
  );
}
