import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { MoodEntry } from "../models/MoodEntry.js";
import { MonthlyChallenge } from "../models/MonthlyChallenge.js";
import { AiSuggestionEvent } from "../models/AiSuggestionEvent.js";
import { GoogleGenAI } from "@google/genai";

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

function buildFallbackChatReply(context, messages) {
  const lastUser = (messages || []).slice().reverse().find((m) => m.role === "user")?.content || "";
  const stressed = new Set(["sad", "anxious", "crying"]);

  const kw = (s) => (lastUser || "").toLowerCase().includes(s);

  const targeted = [];
  const generic = [];

  if (stressed.has(context.moodTag)) {
    targeted.push("I can see you're not feeling your best right now. Take a breath. A small step like a 5-minute walk or a quick mood note can help.");
    targeted.push("Rough moments happen. Keep today simple: drink water, stretch for 2 minutes, then pick one tiny task to complete.");
  }

  if (kw("plan") || kw("day") || kw("steps")) {
    targeted.push("Let's make a 3-step plan: 1) finish one task under 15 minutes, 2) do one medium task for 25 minutes, 3) close with a quick review.");
    targeted.push("Plan for today: start with your easiest unfinished task, then one high-impact task, then a 5-minute cleanup to reset.");
  }

  if (kw("motivate") || kw("finish") || kw("task")) {
    const tasks = context.incompleteTaskCount || 0;
    targeted.push(`You have ${tasks} unfinished ${tasks === 1 ? "task" : "tasks"}. Focus on one small action first; one completion is enough to build momentum.`);
    targeted.push(`You are closer than you think. Pick just one of your ${tasks} tasks and give it 10 focused minutes right now.`);
  }

  if (kw("mood") || kw("recover") || kw("bad mood")) {
    targeted.push("If you're in a bad mood, try this reset: breathe for 60 seconds, move your body for 2 minutes, then do one tiny task.");
    targeted.push("Try a fast mood reset: short walk, one glass of water, then write one sentence about what you can control next.");
  }

  generic.push("I'm here with you. Tell me what you want to work on, and I'll help you break it into one clear next step.");
  generic.push("Nice idea. Want me to break that into one action you can start in the next 2 minutes?");
  generic.push("Great, I can help. Do you want a 3-step plan or one focused next step?");
  generic.push("Let's keep it simple: pick one target, set 10 minutes, and start. I can help choose the target.");

  const pool = targeted.length > 0 ? targeted : generic;
  if (pool.length === 0) return "I'm here. Tell me what you'd like help with.";

  return pool[Math.floor(Math.random() * pool.length)];
}

function extractJsonPayload(text) {
  if (!text || typeof text !== "string") return null;

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || text.trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

let geminiClient = null;

function getGeminiClient() {
  if (!env.geminiApiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return geminiClient;
}

function extractGeminiText(response) {
  if (!response) return null;
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const candidateText = response?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("\n").trim();
  return candidateText || null;
}

async function generateGeminiContent({ prompt, systemInstruction, temperature = 0.7, responseMimeType = undefined, contents = null }) {
  const ai = getGeminiClient();
  if (!ai) {
    console.log("[Gemini] API key not set, skipping...");
    return null;
  }

  try {
    console.log("[Gemini] Sending request with model:", env.geminiModel);
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents:
        contents || [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
      config: {
        systemInstruction,
        temperature,
        responseMimeType
      }
    });

    const text = extractGeminiText(response);
    if (!text) {
      console.warn("[Gemini] Empty response content");
      return null;
    }

    console.log("[Gemini] Response received:", text.slice(0, 80));
    return text;
  } catch (error) {
    console.error("[Gemini] Request failed:", error.message);
    return null;
  }
}

async function requestGeminiGuide(context) {
  const prompt = `You are an encouraging productivity coach inside an app called LevelUp.
Return only JSON with this shape:
{
  "headline": string,
  "message": string,
  "suggestions": [
    {"key": string, "label": string, "description": string, "href": string, "action": string}
  ]
}
Guidelines:
- If mood is sad, anxious, or crying, be gentle and reassuring.
- Motivate the user to finish tasks for points.
- Encourage joining the monthly global challenge.
- Mention the avatar shop when it helps them spend points.
- Keep it short for sidebar and notification surfaces.
User context:
${JSON.stringify(context)}`;
  const text = await generateGeminiContent({
    prompt,
    temperature: 0.7,
    responseMimeType: "application/json"
  });

  if (!text) return null;

  try {
    const parsed = extractJsonPayload(text);
    if (!parsed) {
      console.warn("[Gemini] Could not parse JSON response");
      return null;
    }

    console.log("[Gemini] Success:", parsed.headline || "guide generated");
    return parsed;
  } catch (error) {
    console.error("[Gemini] Request failed:", error.message);
    return null;
  }
}

async function requestGeminiChat(context, messages) {
  const transcript = (messages || [])
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  const prompt = `You are a supportive productivity coach and chat bot inside LevelUp.
User context:
${JSON.stringify({
  name: context.userName,
  points: context.userPoints,
  streak: context.streak,
  incompleteTaskCount: context.incompleteTaskCount,
  moodTag: context.moodTag,
  moodLabel: context.moodLabel,
  monthlyChallenge: context.monthlyChallenge?.title || null
})}

Conversation:
${transcript}

Reply as a concise, motivating assistant. Include one clear next step and optionally one short follow-up question.`;

  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  const text = await generateGeminiContent({
    prompt,
    temperature: 0.8,
    contents
  });

  return text;
}

async function requestOpenAI(context) {
  if (!env.openaiApiKey) {
    console.log("[OpenAI] API key not set, skipping...");
    return null;
  }

  const systemPrompt = `You are an encouraging productivity coach inside an app called LevelUp.\nReturn only JSON with this shape:\n{\n  "headline": string,\n  "message": string,\n  "suggestions": [\n    {"key": string, "label": string, "description": string, "href": string, "action": string}\n  ]\n}\nGuidelines:\n- If mood is sad, anxious, or crying, be gentle and reassuring.\n- Motivate the user to finish tasks for points.\n- Encourage joining the monthly global challenge.\n- Mention the avatar shop when it helps them spend points.\n- Keep it short for sidebar and notification surfaces.`;

  const userPrompt = JSON.stringify(context);
  
  try {
    console.log("[OpenAI] Sending request with model:", env.openaiModel);
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
      const errorData = await response.json().catch(() => ({ error: "Could not parse error" }));
      console.error("[OpenAI] API error:", response.status, errorData);
      throw new Error(`OpenAI API error ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[OpenAI] Empty response content");
      return null;
    }

    console.log("[OpenAI] Parsing response...");
    const parsed = JSON.parse(content);
    console.log("[OpenAI] ✅ Success! Generated:", parsed.headline);
    return parsed;
  } catch (error) {
    console.error("[OpenAI] Request failed:", error.message);
    return null;
  }
}

async function requestOpenAIChat(context, messages) {
  if (!env.openaiApiKey) {
    console.log("[OpenAI Chat] API key not set, skipping...");
    return null;
  }

  const systemPrompt = `You are a supportive productivity coach and chat bot inside an app called LevelUp.
Help the user with motivation, planning, focus, mood check-ins, tasks, challenges, and habits.
Use the user's context when helpful, but keep replies concise and conversational.
Ask one short follow-up question when it helps move the conversation forward.`;

  try {
    console.log("[OpenAI Chat] Sending request with", messages.length, "messages");
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
          {
            role: "system",
            content: `User context: ${JSON.stringify({
              name: context.userName,
              points: context.userPoints,
              streak: context.streak,
              incompleteTaskCount: context.incompleteTaskCount,
              moodTag: context.moodTag,
              moodLabel: context.moodLabel,
              monthlyChallenge: context.monthlyChallenge?.title || null
            })}`
          },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Could not parse error" }));
      console.error("[OpenAI Chat] API error:", response.status, errorData);
      throw new Error(`OpenAI API error ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn("[OpenAI Chat] Empty response content");
      return null;
    }
    
    console.log("[OpenAI Chat] ✅ Success! Reply:", content.slice(0, 80));
    return content.trim();
  } catch (error) {
    console.error("[OpenAI Chat] Request failed:", error.message);
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
  let provider = "fallback";
  try {
    console.log("[AI Guide] Requesting OpenAI with context:", {
      surface: context.surface,
      userName: context.userName,
      userPoints: context.userPoints,
      moodTag: context.moodTag,
      incompleteTaskCount: context.incompleteTaskCount
    });
    guide = await requestOpenAI(context);
    if (guide) {
      provider = "openai";
      console.log("[AI Guide] ✅ OpenAI returned:", guide.headline);
    } else {
      console.log("[AI Guide] OpenAI unavailable, trying Gemini...");
      guide = await requestGeminiGuide(context);
      if (guide) {
        provider = "gemini";
        console.log("[AI Guide] ✅ Gemini returned:", guide.headline);
      }
    }
  } catch (error) {
    console.error("[AI Guide] OpenAI call failed:", error.message);
    console.log("[AI Guide] Trying Gemini after OpenAI error...");
    guide = await requestGeminiGuide(context);
    if (guide) provider = "gemini";
  }

  if (!guide || typeof guide !== "object") {
    console.log("[AI Guide] Using fallback guide");
    guide = buildFallbackGuide(context);
  }

  guide.suggestions = Array.isArray(guide.suggestions) ? guide.suggestions : [];
  guide.surface = surface;
  guide.provider = provider;
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

export const chatWithAi = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];

  if (messages.length === 0) {
    throw new AppError("Missing chat messages", 400);
  }

  const [user, incompleteTaskCount, monthlyChallenge, moodEntry] = await Promise.all([
    User.findById(userId).select({ points: 1, streak: 1, name: 1 }).lean(),
    Task.countDocuments({ userId, completed: false }),
    MonthlyChallenge.findOne({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    })
      .select({ title: 1, description: 1, month: 1, year: 1 })
      .lean(),
    MoodEntry.findOne({ userId, date: getLocalDayKey() }).lean()
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const mood = normalizeMood(moodEntry);
  const context = {
    userName: user.name,
    userPoints: user.points ?? 0,
    streak: user.streak ?? 0,
    incompleteTaskCount,
    moodTag: mood.moodTag,
    moodLabel: mood.moodLabel,
    moodEmoji: mood.moodEmoji,
    monthlyChallenge: monthlyChallenge
      ? {
          title: monthlyChallenge.title,
          description: monthlyChallenge.description,
          month: monthlyChallenge.month,
          year: monthlyChallenge.year
        }
      : null
  };

  const safeMessages = messages
    .filter((message) => ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 500)
    }));

  console.log("[Chat] User:", context.userName, "Messages count:", safeMessages.length, "Last msg:", safeMessages[safeMessages.length - 1]?.content?.slice(0, 50));
  
  let reply = null;
  let provider = "fallback";
  try {
    console.log("[Chat] Calling OpenAI...");
    reply = await requestOpenAIChat(context, safeMessages);
    if (reply) {
      provider = "openai";
      console.log("[Chat] OpenAI reply received:", reply.slice(0, 80));
    } else {
      console.log("[Chat] OpenAI unavailable, trying Gemini...");
      reply = await requestGeminiChat(context, safeMessages);
      if (reply) {
        provider = "gemini";
        console.log("[Chat] Gemini reply received:", reply.slice(0, 80));
      }
    }
  } catch (error) {
    console.error("[Chat] OpenAI call failed:", error.message);
    console.log("[Chat] Trying Gemini after OpenAI error...");
    reply = await requestGeminiChat(context, safeMessages);
    if (reply) provider = "gemini";
  }

  if (!reply) {
    console.log("[Chat] Using fallback response");
    reply = buildFallbackChatReply(context, safeMessages);
  }

  res.status(200).json({ reply, provider });
});