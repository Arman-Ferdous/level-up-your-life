import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import styles from "./ExpenseTrackerComponents.module.css";

const PIE_COLORS = ["#f97316", "#0ea5e9", "#10b981", "#8b5cf6", "#ef4444", "#eab308"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function ExpenseCharts({ categoryBreakdown, dailySeries }) {
  return (
    <section className={styles.chartsGrid}>
      <article className={styles.panel}>
        <h2 className={styles.panelTitle}>Spending by Category</h2>
        {categoryBreakdown.length === 0 ? (
          <p className={styles.emptyText}>No expense data for this month.</p>
        ) : (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="total" nameKey="category" outerRadius={92} label>
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className={styles.panel}>
        <h2 className={styles.panelTitle}>Daily Income vs Expense</h2>
        {dailySeries.length === 0 ? (
          <p className={styles.emptyText}>No transactions for this month.</p>
        ) : (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe7ef" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
}
