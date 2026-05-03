import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationPanel from "./NotificationPanel";
import styles from "./HomeSidebar.module.css";

const MENU_ITEMS = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/pomodoro", label: "Pomodoro", icon: "⏱" },
  { to: "/tasks", label: "Tasks", icon: "✓" },
  { to: "/challenges", label: "Challenges", icon: "🏆" },
  { to: "/groups", label: "Groups", icon: "👥" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/mood", label: "Mood", icon: "🧠" },
  { to: "/expense-tracker", label: "Expenses", icon: "💰" },
  { to: "/leaderboard", label: "Leaderboard", icon: "🥇" },
];

export default function HomeSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className={styles.sidebar} aria-label="Dashboard navigation">
      <div className={styles.shell}>
        <Link to="/" className={styles.brand} aria-label="LevelUp home">
          <span className={styles.brandMark}>L</span>
          <span className={styles.brandText}>LevelUp</span>
        </Link>

        <nav className={styles.menu}>
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.footerRow}>
            <NotificationPanel />
            <span className={styles.points}>Pts {user?.points ?? 0}</span>
            <Link to="/settings/theme" className={styles.footerLink} title="Change Theme">
              🎨
            </Link>
          </div>

          <div className={styles.footerActions}>
            {user?.role === "admin" && (
              <Link to="/admin/users" className={styles.footerLink}>
                Admin
              </Link>
            )}
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}