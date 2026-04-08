import { useEffect, useState } from "react";
import { ChallengeAPI } from "../api/challenge.api";
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
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    betAmount: "",
    dueDate: ""
  });
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  async function loadChallenges() {
    setLoading(true);
    setError("");
    try {
      const res = await ChallengeAPI.getAll();
      setChallenges(res.data.challenges || []);
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
      setChallenges([res.data.challenge, ...challenges]);
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
      setChallenges(challenges.map((challenge) =>
        challenge._id === challengeId ? res.data.challenge : challenge
      ));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update challenge.");
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
