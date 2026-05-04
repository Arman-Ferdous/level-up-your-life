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

  const canSend = useMemo(() => draft.trim().length > 0 && !sending, [draft, sending]);

  if (!user) return null;

  async function sendMessage(content) {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

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
    } catch (error) {
      setProvider("fallback");
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: error?.response?.data?.message || "I couldn’t reach the AI right now. Try again in a moment."
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
                disabled={sending}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
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
        </section>
      )}
    </div>
  );
}