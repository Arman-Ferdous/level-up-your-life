import { useEffect, useState } from "react";
import { AdminAPI } from "../api/admin.api";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminUsersPage.module.css";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAPI.listUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(userId) {
    const target = users.find((u) => u._id === userId);
    const name = target?.name || target?.email || "this user";
    if (!window.confirm(`Delete ${name}? This also deletes their mood and transactions.`)) {
      return;
    }

    setDeletingId(userId);
    setError("");
    try {
      await AdminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Admin: User Management</h1>
        <button className={styles.refreshBtn} onClick={loadUsers} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading users...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentUser?.id === u._id;
                return (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        disabled={isSelf || deletingId === u._id}
                        onClick={() => handleDelete(u._id)}
                        title={isSelf ? "You cannot delete your own account" : "Delete user"}
                      >
                        {deletingId === u._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
