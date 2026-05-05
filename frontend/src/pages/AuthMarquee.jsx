import styles from "./AuthPage.module.css";

const MARQUEE_ROWS = [
  { top: "-30%", duration: "25s", opacity: 0.13, size: "2.5rem" },
  { top: "-18%", duration: "27s", opacity: 0.14, size: "2.6rem" },
  { top: "-6%", duration: "26s", opacity: 0.16, size: "2.7rem" },
  { top: "6%", duration: "28s", opacity: 0.22, size: "3rem" },
  { top: "18%", duration: "30s", opacity: 0.2, size: "2.9rem" },
  { top: "30%", duration: "27s", opacity: 0.19, size: "2.85rem" },
  { top: "42%", duration: "32s", opacity: 0.18, size: "2.8rem" },
  { top: "54%", duration: "29s", opacity: 0.2, size: "2.95rem" },
  { top: "66%", duration: "31s", opacity: 0.18, size: "2.8rem" },
  { top: "78%", duration: "28s", opacity: 0.19, size: "2.9rem" },
  { top: "90%", duration: "26s", opacity: 0.17, size: "2.75rem" },
  { top: "102%", duration: "30s", opacity: 0.14, size: "2.65rem" },
  { top: "114%", duration: "29s", opacity: 0.13, size: "2.55rem" },
  { top: "126%", duration: "27s", opacity: 0.12, size: "2.5rem" },
  { top: "138%", duration: "28s", opacity: 0.11, size: "2.45rem" },
  { top: "150%", duration: "25s", opacity: 0.1, size: "2.4rem" }
];

function MarqueeLine({ duration, opacity, size, top }) {
  return (
    <div className={styles.marqueeRail} style={{ top, opacity }}>
      <div className={styles.marqueeTrack} style={{ ["--marquee-duration"]: duration }}>
        <div className={styles.marqueeGroup}>
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={`a-${index}`}
              className={styles.marqueeText}
              style={{ fontSize: size }}
            >
              Level up
            </span>
          ))}
        </div>
        <div className={styles.marqueeGroup}>
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={`b-${index}`}
              className={styles.marqueeText}
              style={{ fontSize: size }}
            >
              Level up
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AuthMarquee() {
  return (
    <div className={styles.marquee} aria-hidden="true">
      {MARQUEE_ROWS.map((row) => (
        <MarqueeLine key={`${row.top}-${row.duration}`} {...row} />
      ))}
    </div>
  );
}