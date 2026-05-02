import { User } from "../models/User.js";
import { Task } from "../models/Task.js";

// GET /api/leaderboard
// Returns users who have a streak of 30+ days, sorted by streak desc, then points desc
export const getPublicLeaderboard = async (req, res) => {
  try {
    // Find all users with streak >= 30, exclude sensitive fields
    const topUsers = await User.find({ streak: { $gte: 30 } })
      .select("name streak points createdAt")
      .sort({ streak: -1, points: -1 })
      .limit(100);

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      streak: user.streak,
      points: user.points,
      memberSince: user.createdAt,
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

// GET /api/leaderboard/top
// Returns top 10 users by points regardless of streak (for a "Hall of Fame" section)
export const getTopByPoints = async (req, res) => {
  try {
    const topUsers = await User.find({})
      .select("name streak points createdAt")
      .sort({ points: -1 })
      .limit(10);

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      streak: user.streak,
      points: user.points,
      memberSince: user.createdAt,
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch top users" });
  }
};