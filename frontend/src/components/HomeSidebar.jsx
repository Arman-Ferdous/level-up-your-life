import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AiGuide from "./AiGuide";
import NotificationPanel from "./NotificationPanel";
import styles from "./HomeSidebar.module.css";

const MENU_ITEMS = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/pomodoro", label: "Pomodoro", icon: "⏱" },
  { to: "/tasks", label: "Tasks", icon: "✓" },
  { to: "/challenges", label: "Challenges", icon: "🏆" },
  { to: "/avatar-shop", label: "Avatar Shop", icon: "🎭" },
  { to: "/subscription", label: "Subscription", icon: "👑" },
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

        {/* AI guide removed from sidebar per preference; keep AI content in Home Section 2 only */}

        <div className={styles.footer}>
          <div className={styles.footerRow}>
            <NotificationPanel />
            <span className={styles.points}>Pts {user?.points ?? 0}</span>
            <Link to="/settings/theme" className={styles.footerLink} title="Change Theme">
              🎨
            </Link>
            <span className={styles.points}>
              {user?.selectedAvatar?.emoji} Pts {user?.points ?? 0}
            </span>
            <Link
              to="/settings/theme"
              className={styles.footerLink}
              title="Change Theme"
            >
              🎨
            </Link>
          </div>

          {user?.role === "admin" && (
            <div className={styles.footerActions}>
              <Link to="/admin/users" className={styles.footerLink}>
                Admin
              </Link>
            )}
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
            <Link
              to="/settings/theme"
              className={styles.footerLink}
              style={{ marginTop: "0.5rem", display: "block", textAlign: "center" }}
            >
              🎨 Theme
            </Link>
          </div>
              <Link to="/admin/revenue" className={styles.footerLink}>
                Revenue
              </Link>
            </div>
          )}

          <button
            type="button"
            className={`${styles.menuItem} ${styles.menuButton} ${styles.logoutMenuItem}`}
            onClick={handleLogout}
            title="Logout"
          >
            <span className={styles.menuIcon}>🚪</span>
            <span className={styles.menuLabel}>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}