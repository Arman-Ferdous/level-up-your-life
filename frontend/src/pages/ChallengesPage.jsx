import { useEffect, useState } from "react";
import { ChallengeAPI } from "../api/challenge.api";
import { useAuth } from "../context/AuthContext";
import styles from "./ChallengesPage.module.css";

const STATUS_LABELS = {
  active: "Active",
  won: "Won",
  lost: "Lost"
};

const STATUS_CLASSES = {
  active: styles.statusActive,
  won: styles.statusWon,
  lost: styles.statusLost
};

export default function ChallengesPage() {
  const { user, syncUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [monthlyChallenges, setMonthlyChallenges] = useState([]);
  const [leaderboardsById, setLeaderboardsById] = useState({});
  const [openLeaderboardId, setOpenLeaderboardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    betAmount: "",
    dueDate: ""
  });
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [monthlyActionId, setMonthlyActionId] = useState("");
  const [monthlySubmitLoading, setMonthlySubmitLoading] = useState(false);
  const [monthlyFormData, setMonthlyFormData] = useState({
    title: "",
    description: "",
    month: "",
    year: "",
    startDate: "",
    endDate: ""
  });

  function upsertMonthlyChallenge(nextChallenge) {
    setMonthlyChallenges((prev) => {
      const index = prev.findIndex((item) => item._id === nextChallenge._id);
      if (index === -1) {
        return [nextChallenge, ...prev];
      }
      const clone = [...prev];
      clone[index] = nextChallenge;
      return clone;
    });
  }

  async function loadChallenges() {
    setLoading(true);
    setError("");
    try {
      const [personalRes, monthlyRes] = await Promise.all([
        ChallengeAPI.getAll(),
        ChallengeAPI.getMonthly()
      ]);
      setChallenges(personalRes.data.challenges || []);
      setMonthlyChallenges(monthlyRes.data.monthlyChallenges || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load challenges.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallenges();
  }, []);

  async function handleCreateChallenge(event) {
    event.preventDefault();
    setError("");

    const betAmount = Number(formData.betAmount);
    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!betAmount || betAmount <= 0) {
      setError("Bet amount must be greater than zero.");
      return;
    }
    if (!formData.dueDate) {
      setError("Due date is required.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await ChallengeAPI.create({
        title: formData.title,
        description: formData.description,
        betAmount,
        dueDate: new Date(formData.dueDate).toISOString()
      });
      setChallenges((prev) => [res.data.challenge, ...prev]);
      setFormData({ title: "", description: "", betAmount: "", dueDate: "" });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create challenge.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function resolveChallenge(challengeId, action) {
    setError("");
    try {
      const res = action === "win"
        ? await ChallengeAPI.complete(challengeId)
        : await ChallengeAPI.fail(challengeId);
      setChallenges((prev) => prev.map((challenge) =>
        challenge._id === challengeId ? res.data.challenge : challenge
      ));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update challenge.");
    }
  }

  async function handleRegisterMonthly(challengeId) {
    setMonthlyActionId(challengeId);
    setError("");
    try {
      const res = await ChallengeAPI.registerMonthly(challengeId);
      upsertMonthlyChallenge(res.data.monthlyChallenge);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to register for the monthly challenge.");
    } finally {
      setMonthlyActionId("");
    }
  }

  async function handleCompleteMonthly(challengeId) {
    setMonthlyActionId(challengeId);
    setError("");
    try {
      const res = await ChallengeAPI.completeMonthly(challengeId);
      upsertMonthlyChallenge(res.data.monthlyChallenge);
      if (res.data.updatedUser) {
        syncUser(res.data.updatedUser);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to complete the monthly challenge.");
    } finally {
      setMonthlyActionId("");
    }
  }

  async function toggleLeaderboard(challengeId) {
    if (openLeaderboardId === challengeId) {
      setOpenLeaderboardId("");
      return;
    }

    setOpenLeaderboardId(challengeId);
    if (leaderboardsById[challengeId]) {
      return;
    }

    try {
      const res = await ChallengeAPI.getMonthlyLeaderboard(challengeId);
      setLeaderboardsById((prev) => ({
        ...prev,
        [challengeId]: {
          leaderboard: res.data.leaderboard || [],
          winner: res.data.winner || null
        }
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leaderboard.");
    }
  }

  async function handleCreateMonthly(event) {
    event.preventDefault();
    setError("");

    if (!monthlyFormData.title.trim()) {
      setError("Monthly challenge title is required.");
      return;
    }

    const month = Number(monthlyFormData.month);
    const year = Number(monthlyFormData.year);

    if (month < 1 || month > 12) {
      setError("Month must be between 1 and 12.");
      return;
    }

    if (!year || year < 2024) {
      setError("Year must be 2024 or later.");
      return;
    }

    if (!monthlyFormData.startDate || !monthlyFormData.endDate) {
      setError("Start and end dates are required.");
      return;
    }

    const startDate = new Date(monthlyFormData.startDate);
    const endDate = new Date(monthlyFormData.endDate);
    if (endDate.getTime() <= startDate.getTime()) {
      setError("End date must be after start date.");
      return;
    }

    setMonthlySubmitLoading(true);
    try {
      const res = await ChallengeAPI.createMonthly({
        title: monthlyFormData.title,
        description: monthlyFormData.description,
        month,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      setMonthlyChallenges((prev) => [res.data.monthlyChallenge, ...prev]);
      setMonthlyFormData({
        title: "",
        description: "",
        month: "",
        year: "",
        startDate: "",
        endDate: ""
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create monthly challenge.");
    } finally {
      setMonthlySubmitLoading(false);
    }
  }

  async function handleDeleteMonthly(challengeId) {
    const target = monthlyChallenges.find((item) => item._id === challengeId);
    const name = target?.title || "this challenge";
    if (!window.confirm(`Delete ${name}?`)) {
      return;
    }

    setMonthlyActionId(challengeId);
    setError("");
    try {
      await ChallengeAPI.deleteMonthly(challengeId);
      setMonthlyChallenges((prev) => prev.filter((item) => item._id !== challengeId));
      if (openLeaderboardId === challengeId) {
        setOpenLeaderboardId("");
      }
      setLeaderboardsById((prev) => {
        const clone = { ...prev };
        delete clone[challengeId];
        return clone;
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete monthly challenge.");
    } finally {
      setMonthlyActionId("");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Betting Challenges</p>
          <h1 className={styles.title}>Use earned task points to wager on challenges.</h1>
          <p className={styles.description}>
            Complete tasks to earn points, then bet those points on challenges.
            If you win, you earn twice your bet. If you lose, your points reset to zero.
          </p>
        </div>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Create a new challenge</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={handleCreateChallenge}>
          <div className={styles.fieldGroup}>
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label>Bet Amount</label>
              <input
                type="number"
                min="1"
                value={formData.betAmount}
                onChange={(e) => setFormData({ ...formData, betAmount: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
            {submitLoading ? "Creating challenge..." : "Create Challenge"}
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Global monthly challenges</h2>
        <p className={styles.message}>
          Register to compete with everyone. Complete the challenge to climb the leaderboard.
        </p>

        {monthlyChallenges.length === 0 ? (
          <p className={styles.message}>No monthly challenges yet.</p>
        ) : (
          <div className={styles.list}>
            {monthlyChallenges.map((challenge) => {
              const leaderboardData = leaderboardsById[challenge._id];
              const userEntry = challenge.currentUserEntry;
              const isBusy = monthlyActionId === challenge._id;
              const didComplete = Boolean(userEntry?.completed);
              const completionReward = didComplete
                ? (challenge.winner?.userId === user?.id ? 50 : 15)
                : 0;

              return (
                <div key={challenge._id} className={styles.challengeCard}>
                  <div className={styles.cardHeader}>
                    <h3>{challenge.title}</h3>
                    <span className={styles.statusBadge}>
                      {challenge.month}/{challenge.year}
                    </span>
                  </div>

                  <p className={styles.challengeDesc}>{challenge.description || "No description"}</p>

                  <div className={styles.cardMeta}>
                    <span>Participants: {challenge.participantCount}</span>
                    <span>Completed: {challenge.completedCount}</span>
                    <span>
                      Winner: {challenge.winner ? challenge.winner.name : "No winner yet"}
                    </span>
                  </div>

                  <div className={styles.cardMeta}>
                    <span>Start: {new Date(challenge.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(challenge.endDate).toLocaleDateString()}</span>
                  </div>

                  <div className={styles.cardActions}>
                    {!userEntry && (
                      <button
                        type="button"
                        className={styles.submitBtn}
                        disabled={isBusy}
                        onClick={() => handleRegisterMonthly(challenge._id)}
                      >
                        {isBusy ? "Registering..." : "Register"}
                      </button>
                    )}

                    {userEntry && !userEntry.completed && (
                      <button
                        type="button"
                        className={styles.completeBtn}
                        disabled={isBusy}
                        onClick={() => handleCompleteMonthly(challenge._id)}
                      >
                        {isBusy ? "Saving..." : "Mark Completed"}
                      </button>
                    )}

                    {didComplete && (
                      <span className={styles.rewardBadge}>
                        You earned +{completionReward} points
                      </span>
                    )}

                    <button
                      type="button"
                      className={styles.failBtn}
                      onClick={() => toggleLeaderboard(challenge._id)}
                    >
                      {openLeaderboardId === challenge._id ? "Hide leaderboard" : "View leaderboard"}
                    </button>

                    {user?.role === "admin" && (
                      <button
                        type="button"
                        className={styles.failBtn}
                        disabled={isBusy}
                        onClick={() => handleDeleteMonthly(challenge._id)}
                      >
                        {isBusy ? "Deleting..." : "Delete challenge"}
                      </button>
                    )}
                  </div>

                  {openLeaderboardId === challenge._id && (
                    <div className={styles.leaderboardBox}>
                      <h4>Leaderboard</h4>
                      {(leaderboardData?.leaderboard || challenge.leaderboard || []).length === 0 ? (
                        <p className={styles.message}>No participants yet.</p>
                      ) : (
                        <div className={styles.leaderboardList}>
                          {(leaderboardData?.leaderboard || challenge.leaderboard || []).map((entry) => (
                            <div key={`${entry.userId || "unknown"}-${entry.rank}`} className={styles.leaderboardRow}>
                              <span>#{entry.rank}</span>
                              <span>{entry.name}</span>
                              <span>{entry.completed ? "Completed" : "Registered"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {user?.role === "admin" && (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Admin: Create monthly challenge</h2>
          <form className={styles.form} onSubmit={handleCreateMonthly}>
            <div className={styles.fieldGroup}>
              <label>Title</label>
              <input
                type="text"
                value={monthlyFormData.title}
                onChange={(e) => setMonthlyFormData({ ...monthlyFormData, title: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Description</label>
              <textarea
                rows={3}
                value={monthlyFormData.description}
                onChange={(e) => setMonthlyFormData({ ...monthlyFormData, description: e.target.value })}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label>Month (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={monthlyFormData.month}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, month: e.target.value })}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Year</label>
                <input
                  type="number"
                  min="2024"
                  value={monthlyFormData.year}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, year: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={monthlyFormData.startDate}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, startDate: e.target.value })}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  value={monthlyFormData.endDate}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, endDate: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={monthlySubmitLoading}>
              {monthlySubmitLoading ? "Creating monthly challenge..." : "Create monthly challenge"}
            </button>
          </form>
        </section>
      )}

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Your challenges</h2>
        {loading ? (
          <p className={styles.message}>Loading challenges…</p>
        ) : challenges.length === 0 ? (
          <p className={styles.message}>No challenges yet. Create one to start betting.</p>
        ) : (
          <div className={styles.list}>
            {challenges.map((challenge) => (
              <div key={challenge._id} className={styles.challengeCard}>
                <div className={styles.cardHeader}>
                  <h3>{challenge.title}</h3>
                  <span className={`${styles.statusBadge} ${STATUS_CLASSES[challenge.status]}`}>
                    {STATUS_LABELS[challenge.status]}
                  </span>
                </div>
                <p className={styles.challengeDesc}>{challenge.description || "No description"}</p>
                <div className={styles.cardMeta}>
                  <span>Bet: {challenge.betAmount}</span>
                  <span>Due: {new Date(challenge.dueDate).toLocaleDateString()}</span>
                </div>
                {challenge.status === "active" && (
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.completeBtn}
                      onClick={() => resolveChallenge(challenge._id, "win")}
                    >
                      Mark as Won
                    </button>
                    <button
                      type="button"
                      className={styles.failBtn}
                      onClick={() => resolveChallenge(challenge._id, "lose")}
                    >
                      Mark as Lost
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
