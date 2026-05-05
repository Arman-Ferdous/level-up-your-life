import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import { ChallengeAPI } from "../api/challenge.api";
import "./LeaderboardPage.css";

const MEDALS = ["🥇", "🥈", "🥉"];

const tabs = [
  { key: "streak", label: "30-Day Champions" },
  { key: "points", label: "Hall of Fame" },
  { key: "challenge", label: "Global Challenge" },
];

export default function LeaderboardPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "streak";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challengeInfo, setChallengeInfo] = useState(null);

  const fetchData = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "challenge") {
        // Fetch current monthly challenge
        const res = await ChallengeAPI.getMonthly();
        const challenges = res.data.monthlyChallenges || [];
        
        if (challenges.length === 0) {
          setError("No global challenge available.");
          setLeaderboard([]);
          setChallengeInfo(null);
        } else {
          const challenge = challenges[0];
          setChallengeInfo({
            _id: challenge._id,
            title: challenge.title,
            description: challenge.description,
            month: challenge.month,
            year: challenge.year,
          });
          
          // Fetch leaderboard for this challenge
          const leaderboardRes = await ChallengeAPI.getMonthlyLeaderboard(challenge._id);
          if (leaderboardRes.data?.leaderboard) {
            setLeaderboard(leaderboardRes.data.leaderboard);
          } else {
            setError("Failed to load challenge leaderboard.");
            setLeaderboard([]);
          }
        }
      } else {
        try {
          const endpoint =
            tab === "streak"
              ? "/api/leaderboard"
              : "/api/leaderboard/top";
          const res = await api.get(endpoint);
          if (res.data?.success) {
            setLeaderboard(res.data.leaderboard);
            setChallengeInfo(null);
          } else {
            setError("Failed to load leaderboard.");
          }
        } catch (err) {
          throw err;
        }
      }
    } catch (err) {
      setError("Could not connect to server.");
      console.error(err);
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
          {activeTab === "challenge" ? "Global Challenge Leaderboard" : "Public Leaderboard"}
        </h1>
        <p className="lb-subtitle">
          {activeTab === "challenge" 
            ? challengeInfo 
              ? `${challengeInfo.title} — Complete it first!`
              : "View who completed the global monthly challenge first."
            : activeTab === "points"
            ? "Top users by total points."
            : "Users who levelled up their lives — 30 consecutive days strong."}
        </p>
      </div>

      {/* Challenge info card */}
      {activeTab === "challenge" && challengeInfo && !loading && (
        <div className="lb-challenge-info">
          <div className="lb-challenge-info-content">
            <h3 className="lb-challenge-info-title">{challengeInfo.title}</h3>
            <p className="lb-challenge-info-desc">{challengeInfo.description}</p>
            <div className="lb-challenge-info-meta">
              <span>{challengeInfo.month}/{challengeInfo.year}</span>
            </div>
          </div>
        </div>
      )}

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
            <p>Loading {activeTab === "challenge" ? "challenge leaderboard" : "champions"}…</p>
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
            <span className="lb-empty-icon">{activeTab === "challenge" ? "🏁" : "🌱"}</span>
            <p>
              {activeTab === "challenge"
                ? "No one has completed the challenge yet. Be the first!"
                : "No champions yet. Be the first to hit 30 days!"}
            </p>
          </div>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div className="lb-table-wrapper">
            {/* Top 3 podium - only for streak and points */}
            {activeTab !== "challenge" && leaderboard.length >= 3 && (
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
            {activeTab === "challenge" ? (
              <table className="lb-table lb-table--challenge">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={`${entry.userId}-${entry.rank}`} className={entry.completed ? "lb-row--completed" : ""}>
                      <td className="lb-rank-cell">
                        {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                      </td>
                      <td className="lb-name-cell">
                        <span className="lb-avatar">
                          {entry.name.charAt(0).toUpperCase()}
                        </span>
                        {entry.name}
                      </td>
                      <td>
                        {entry.completed ? (
                          <span className="lb-badge lb-badge--success">✓ Completed</span>
                        ) : (
                          <span className="lb-badge lb-badge--pending">In Progress</span>
                        )}
                      </td>
                      <td>
                        {entry.completedAt ? (
                          <span className="lb-time">
                            {new Date(entry.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        ) : (
                          <span className="lb-time">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
