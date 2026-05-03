import { useState, useEffect } from "react";
import styles from "./MotivationalQuote.module.css";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" },
];

export default function MotivationalQuote() {
  const [quote, setQuote] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(random);
    // fade in after mount
    setTimeout(() => setVisible(true), 100);
  }, []);

  if (!quote) return null;

  return (
    <div className={`${styles.quoteCard} ${visible ? styles.visible : ""}`}>
      <span className={styles.quoteIcon}>💬</span>
      <div className={styles.quoteBody}>
        <p className={styles.quoteText}>"{quote.text}"</p>
        <p className={styles.quoteAuthor}>— {quote.author}</p>
      </div>
    </div>
  );
}
