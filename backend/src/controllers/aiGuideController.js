import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { MoodEntry } from "../models/MoodEntry.js";
import { MonthlyChallenge } from "../models/MonthlyChallenge.js";
import { AiSuggestionEvent } from "../models/AiSuggestionEvent.js";

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeMood(mood) {
  if (!mood?.emoji) return { moodTag: "neutral", moodLabel: "neutral", moodEmoji: "🙂" };

  const lookup = {
    "😭": { moodTag: "crying", moodLabel: "crying" },
    "😞": { moodTag: "sad", moodLabel: "sad" },
    "😐": { moodTag: "neutral", moodLabel: "neutral" },
    "🙂": { moodTag: "okay", moodLabel: "okay" },
    "😊": { moodTag: "good", moodLabel: "good" },
    "🤩": { moodTag: "great", moodLabel: "great" }
  };

  return {
    moodTag: lookup[mood.emoji]?.moodTag || "neutral",
    moodLabel: lookup[mood.emoji]?.moodLabel || mood.note || "neutral",
    moodEmoji: mood.emoji
  };
}

function buildFallbackGuide(context) {
  const suggestions = [];
  const stressedMoods = new Set(["sad", "anxious", "crying"]);

  if (stressedMoods.has(context.moodTag)) {
    suggestions.push({
      key: "reset_mood",
      label: "Take a reset",
      description: "Use the mood journal or take a short break.",
      href: "/mood",
      action: "open_mood"
    });
  }

  if (context.incompleteTaskCount > 0) {
    suggestions.push({
      key: "complete_task",
      label: "Complete one task",
      description: "Finishing even one task can unlock momentum.",
      href: "/tasks",
      action: "complete_task"
    });
  }

  if (context.monthlyChallenge) {
    suggestions.push({
      key: "join_monthly",
      label: "Join monthly challenge",
      description: `Participate in ${context.monthlyChallenge.title} to earn points and compete.`,
      href: "/challenges",
      action: "join_monthly_challenge"
    });
  }

  suggestions.push({
    key: "earn_points",
    label: "Earn more points",
    description: "Task completion, monthly challenges, and daily habits all grow your total.",
    href: "/challenges",
    action: "earn_points"
  });

  suggestions.push({
    key: "avatar_shop",
    label: "Spend points in Avatar Shop",
    description: "Use extra points to unlock a new avatar.",
    href: "/avatar-shop",
    action: "open_avatar_shop"
  });

  const messageParts = [];
  if (stressedMoods.has(context.moodTag)) {
    messageParts.push("You’re dealing with a hard moment. Keep it small and simple today.");
  }
  if (context.incompleteTaskCount > 0) {
    messageParts.push(`You still have ${context.incompleteTaskCount} unfinished task${context.incompleteTaskCount === 1 ? "" : "s"}.`);
  }
  if (context.monthlyChallenge) {
    messageParts.push(`A global challenge is live: ${context.monthlyChallenge.title}.`);
  }
  if ((context.userPoints ?? 0) < 100) {
    messageParts.push("Your points can grow fast if you keep moving.");
  } else {
    messageParts.push("You have a strong base already. Protect the streak and keep earning.");
  }

  return {
    headline: "Keep moving",
    message: messageParts.join(" "),
    suggestions: suggestions.slice(0, context.surface === "home" ? 4 : 2)
  };
}

async function requestOpenAI(context) {
  if (!env.openaiApiKey) return null;

  const systemPrompt = `You are an encouraging productivity coach inside an app called LevelUp.\nReturn only JSON with this shape:\n{\n  "headline": string,\n  "message": string,\n  "suggestions": [\n    {"key": string, "label": string, "description": string, "href": string, "action": string}\n  ]\n}\nGuidelines:\n- If mood is sad, anxious, or crying, be gentle and reassuring.\n- Motivate the user to finish tasks for points.\n- Encourage joining the monthly global challenge.\n- Mention the avatar shop when it helps them spend points.\n- Keep it short for sidebar and notification surfaces.`;

  const userPrompt = JSON.stringify(context);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export const getAiGuide = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const surface = ["home", "sidebar", "notifications"].includes(req.body?.surface)
    ? req.body.surface
    : "home";
  const todayKey = getLocalDayKey();

  const [user, incompleteTaskCount, monthlyChallenge, moodEntry] = await Promise.all([
    User.findById(userId).select({ points: 1, streak: 1, name: 1 }).lean(),
    Task.countDocuments({ userId, completed: false }),
    MonthlyChallenge.findOne({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    })
      .select({ title: 1, description: 1, month: 1, year: 1 })
      .lean(),
    MoodEntry.findOne({ userId, date: todayKey }).lean()
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const mood = normalizeMood(moodEntry);
  const context = {
    surface,
    userName: user.name,
    userPoints: user.points ?? 0,
    streak: user.streak ?? 0,
    incompleteTaskCount,
    moodTag: req.body?.moodTag || mood.moodTag,
    moodLabel: req.body?.moodLabel || mood.moodLabel,
    moodEmoji: req.body?.moodEmoji || mood.moodEmoji,
    monthlyChallenge: monthlyChallenge
      ? {
          title: monthlyChallenge.title,
          description: monthlyChallenge.description,
          month: monthlyChallenge.month,
          year: monthlyChallenge.year
        }
      : null
  };

  let guide = null;
  try {
    guide = await requestOpenAI(context);
  } catch (error) {
    console.warn("AI guide fallback used:", error.message);
  }

  if (!guide || typeof guide !== "object") {
    guide = buildFallbackGuide(context);
  }

  guide.suggestions = Array.isArray(guide.suggestions) ? guide.suggestions : [];
  guide.surface = surface;
  guide.metrics = {
    incompleteTaskCount,
    userPoints: user.points ?? 0,
    streak: user.streak ?? 0,
    hasMonthlyChallenge: Boolean(monthlyChallenge)
  };

  res.status(200).json({ guide });
});

export const trackAiSuggestionAction = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { surface, eventType = "click", suggestionKey, suggestionLabel = "", destination = "", metadata = {} } = req.body || {};

  if (!suggestionKey) {
    throw new AppError("Missing suggestion key", 400);
  }

  if (!["home", "sidebar", "notifications"].includes(surface)) {
    throw new AppError("Invalid surface", 400);
  }

  const event = await AiSuggestionEvent.create({
    userId,
    surface,
    eventType: eventType === "impression" ? "impression" : "click",
    suggestionKey,
    suggestionLabel,
    destination,
    metadata
  });

  res.status(201).json({ event });
});