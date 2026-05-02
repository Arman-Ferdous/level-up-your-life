import { useEffect, useState } from "react";
import "./LeaderboardPage.css";

const MEDALS = ["🥇", "🥈", "🥉"];

const tabs = [
  { key: "streak", label: "30-Day Champions" },
  { key: "points", label: "Hall of Fame" },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("streak");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        tab === "streak"
          ? "http://localhost:5001/api/leaderboard"
          : "http://localhost:5001/api/leaderboard/top";
const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        setError("Failed to load leaderboard.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  return (
    <div className="lb-page">
      {/* Hero */}
      <div className="lb-hero">
        <div className="lb-hero-glow" />
        <h1 className="lb-title">
          <span className="lb-title-icon">🏆</span>
          Public Leaderboard
        </h1>
        <p className="lb-subtitle">
          Users who levelled up their lives — 30 consecutive days strong.
        </p>
      </div>

      {/* Tabs */}
      <div className="lb-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`lb-tab ${activeTab === t.key ? "lb-tab--active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="lb-content">
        {loading && (
          <div className="lb-state">
            <div className="lb-spinner" />
            <p>Loading champions…</p>
          </div>
        )}

        {error && !loading && (
          <div className="lb-state lb-state--error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="lb-state lb-state--empty">
            <span className="lb-empty-icon">🌱</span>
            <p>No champions yet. Be the first to hit 30 days!</p>
          </div>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div className="lb-table-wrapper">
            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="lb-podium">
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map(
                  (user, i) => {
                    const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                    return (
                      <div
                        key={user.name}
                        className={`lb-podium-card lb-podium-card--${actualRank}`}
                      >
                        <div className="lb-podium-medal">
                          {MEDALS[actualRank - 1]}
                        </div>
                        <div className="lb-podium-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="lb-podium-name">{user.name}</div>
                        <div className="lb-podium-streak">
                          🔥 {user.streak} days
                        </div>
                        <div className="lb-podium-points">
                          ⭐ {user.points} pts
                        </div>
                        <div
                          className={`lb-podium-bar lb-podium-bar--${actualRank}`}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* Full table */}
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>🔥 Streak</th>
                  <th>⭐ Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user) => (
                  <tr
                    key={user.rank}
                    className={user.rank <= 3 ? "lb-row--top" : ""}
                  >
                    <td className="lb-rank-cell">
                      {user.rank <= 3
                        ? MEDALS[user.rank - 1]
                        : `#${user.rank}`}
                    </td>
                    <td className="lb-name-cell">
                      <span className="lb-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      {user.name}
                    </td>
                    <td>
                      <span className="lb-badge lb-badge--streak">
                        {user.streak} days
                      </span>
                    </td>
                    <td>
                      <span className="lb-badge lb-badge--points">
                        {user.points} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
