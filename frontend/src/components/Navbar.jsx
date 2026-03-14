import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>LevelUp</Link>
      </div>
      <div style={styles.right}>
        {user ? (
          <>
            <Link to="/" style={styles.link}>Home</Link>
            <Link to="/mood" style={styles.link}>Mood</Link>
            <Link to="/expense-tracker" style={styles.link}>Expense Tracker</Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(120deg, #0f172a, #1e3a5f)",
    color: "#fff",
  },
  left: {
    display: "flex",
    alignItems: "center",
  },
  brand: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1.2rem",
    textDecoration: "none",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "0.95rem",
    opacity: 0.95,
  },
  logoutBtn: {
    background: "none",
    border: "1px solid rgba(255, 255, 255, 0.7)",
    color: "#fff",
    padding: "0.3rem 0.75rem",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};
