import { useEffect, useMemo, useState } from "react";
import { AiAPI } from "../api/ai.api";
import { useAuth } from "../context/AuthContext";
import styles from "./AiChatLauncher.module.css";

const QUICK_PROMPTS = [
  "Help me plan my day",
  "What should I do first?",
  "Motivate me to finish one task",
  "Help me recover from a bad mood"
];

export default function AiChatLauncher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [provider, setProvider] = useState(null);
  const [usage, setUsage] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "I’m your LevelUp coach. Ask me what you want to focus on and I’ll help you turn it into a next step."
    }
  ]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("open-ai-chat", openChat);
    return () => window.removeEventListener("open-ai-chat", openChat);
  }, []);

  useEffect(() => {
    if (!user || !open) return;

    let active = true;
    async function loadUsage() {
      try {
        const response = await AiAPI.getUsage();
        if (active) setUsage(response.data || null);
      } catch {
        if (active) setUsage(null);
      } finally {
        if (!active) return;
      }
    }

    loadUsage();
    return () => {
      active = false;
    };
  }, [open, user]);

  const isPremium = usage?.isPremium ?? user?.isPremium ?? false;
  const remaining = typeof usage?.remaining === "number" ? usage.remaining : null;
  const used = typeof usage?.used === "number" ? usage.used : null;
  const limitReached = !isPremium && remaining !== null && remaining <= 0;
  const nudgeActive = !isPremium && remaining === 1;
  const showUsageText = !isPremium && remaining !== null && remaining >= 2;

  const canSend = useMemo(
    () => draft.trim().length > 0 && !sending && !limitReached,
    [draft, sending, limitReached]
  );

  if (!user) return null;

  async function refreshUsage() {
    try {
      const response = await AiAPI.getUsage();
      setUsage(response.data || null);
    } catch {
      setUsage((prev) => prev || null);
    } finally {
    }
  }

  async function sendMessage(content) {
    const trimmed = content.trim();
    if (!trimmed || sending || limitReached) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    try {
      const response = await AiAPI.chat({ messages: nextMessages });
      const respProvider = response.data.provider || "fallback";
      setProvider(respProvider);

      setMessages([
        ...nextMessages,
        { role: "assistant", content: response.data.reply || "I’m here with you." }
      ]);
      await refreshUsage();
    } catch (error) {
      setProvider("fallback");
      if (error?.response?.status === 429) {
        setUsage({
          used: error?.response?.data?.used ?? 5,
          limit: error?.response?.data?.limit ?? 5,
          remaining: 0,
          isPremium: false,
          resetsAt: error?.response?.data?.resetsAt || null
        });
      }
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "I couldn’t reach the AI right now. Try again in a moment."
        }
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(draft);
  }

  return (
    <div className={styles.launcher}>
      {!open && (
        <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Open AI chat">
          <span className={styles.fabIcon}>✨</span>
          <span className={styles.fabText}>Chat with AI</span>
        </button>
      )}

      {open && (
        <section className={styles.panel} aria-label="AI chat assistant">
          <div className={styles.header}>
            <div>
              <p className={styles.kicker}>AI Coach</p>
              <h2 className={styles.title}>Talk to LevelUp</h2>
              {isPremium && <span className={styles.premiumTag}>✨ Premium — Unlimited</span>}
              {(provider === "openai" || provider === "gemini") && (
                <p className={styles.providerBadge} data-provider={provider}>
                  {provider === "openai" ? "Powered by OpenAI" : "Powered by Gemini"}
                </p>
              )}
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Close AI chat">
              ×
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`${styles.messageRow} ${styles[message.role]}`}>
                <div className={styles.bubble}>{message.content}</div>
              </div>
            ))}
            {sending && <div className={styles.typing}>LevelUp is thinking...</div>}
          </div>

          <div className={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.quickPrompt}
                onClick={() => sendMessage(prompt)}
                disabled={sending || limitReached}
              >
                {prompt}
              </button>
            ))}
          </div>

          {!limitReached ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              {showUsageText && (
                <p className={styles.usageText}>
                  {remaining === 5 && used === 0
                    ? "5/5 messages today"
                    : `${used ?? 0}/5 messages used today`}
                </p>
              )}
              {nudgeActive && (
                <div className={styles.nudgeBanner}>
                  <span className={styles.nudgeText}>⚡ 1 message left today — go Premium for unlimited AI chat</span>
                  <a className={styles.nudgeButton} href="/subscription">
                    Upgrade
                  </a>
                </div>
              )}
              <textarea
                className={styles.input}
                rows={3}
                placeholder="Ask for help with focus, mood, tasks, or motivation..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className={styles.sendButton} disabled={!canSend}>
                Send
              </button>
            </form>
          ) : (
            <div className={styles.limitCard}>
              <div className={styles.limitTitle}>🔒 Daily limit reached</div>
              <p className={styles.limitSubtitle}>Upgrade to Premium for unlimited conversations</p>
              <a className={styles.limitButton} href="/subscription">
                Go Premium
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}