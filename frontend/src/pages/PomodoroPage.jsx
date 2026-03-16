import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PomodoroPage.module.css";

const MODES = {
  focus: { label: "Focus", defaultSeconds: 25 * 60 },
  short: { label: "Short Break", defaultSeconds: 5 * 60 },
  long: { label: "Long Break", defaultSeconds: 15 * 60 }
};

const TIMER_RADIUS = 128;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const mins = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function nextMode(currentMode) {
  if (currentMode === "focus") return "short";
  return "focus";
}

function parseDurationInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    const [minsRaw, secsRaw] = trimmed.split(":");
    const mins = Number(minsRaw);
    const secs = Number(secsRaw);
    if (!Number.isInteger(mins) || !Number.isInteger(secs) || mins < 0 || secs < 0 || secs > 59) {
      return null;
    }
    const total = mins * 60 + secs;
    return total >= 10 ? total : null;
  }

  const mins = Number(trimmed);
  if (!Number.isFinite(mins) || mins <= 0) return null;
  const total = Math.round(mins * 60);
  return total >= 10 ? total : null;
}

function sanitizeDurationInput(value) {
  const filtered = value.replace(/[^\d:]/g, "");
  const firstColon = filtered.indexOf(":");

  if (firstColon === -1) {
    return filtered.slice(0, 3);
  }

  const mins = filtered.slice(0, firstColon).replace(/:/g, "").slice(0, 3);
  const secs = filtered.slice(firstColon + 1).replace(/:/g, "").slice(0, 2);
  return `${mins}:${secs}`;
}

export default function PomodoroPage() {
  const [durations, setDurations] = useState({
    focus: MODES.focus.defaultSeconds,
    short: MODES.short.defaultSeconds,
    long: MODES.long.defaultSeconds
  });
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.defaultSeconds);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [status, setStatus] = useState("Ready to focus");
  const [editValue, setEditValue] = useState(formatTime(MODES.focus.defaultSeconds));

  const endTimeRef = useRef(null);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;

      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setRunning(false);

        const previousMode = mode;
        if (previousMode === "focus") {
          setCompletedPomodoros((count) => count + 1);
        }

        const upcomingMode = nextMode(previousMode);
        setMode(upcomingMode);
        setSecondsLeft(durations[upcomingMode]);
        setEditValue(formatTime(durations[upcomingMode]));
        setStatus(
          previousMode === "focus"
            ? "Focus session complete. Time for a short break."
            : "Break complete. Back to focus."
        );
      }
    }, 250);

    return () => clearInterval(interval);
  }, [running, mode, durations]);

  useEffect(() => {
    if (!running) {
      setEditValue(formatTime(secondsLeft));
    }
  }, [secondsLeft, running]);

  useEffect(() => {
    const label = MODES[mode].label;
    document.title = `${formatTime(secondsLeft)} - ${label} | LevelUp`;
    return () => {
      document.title = "LevelUp";
    };
  }, [secondsLeft, mode]);

  const progress = useMemo(() => {
    const total = durations[mode];
    if (!total) return 0;
    return Math.max(0, Math.min(100, (secondsLeft / total) * 100));
  }, [mode, secondsLeft, durations]);

  const ringOffset = useMemo(() => {
    const ratio = progress / 100;
    return TIMER_CIRCUMFERENCE * (1 - ratio);
  }, [progress]);

  const handRotation = useMemo(() => {
    const ratio = progress / 100;
    return ratio * 360;
  }, [progress]);

  function handleStartPause() {
    if (running) {
      setRunning(false);
      const pauseAt = Date.now() + secondsLeft * 1000;
      endTimeRef.current = pauseAt;
      setStatus("Paused");
      return;
    }

    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
    setStatus(`${MODES[mode].label} in progress`);
  }

  function handleReset() {
    setRunning(false);
    setSecondsLeft(durations[mode]);
    setEditValue(formatTime(durations[mode]));
    endTimeRef.current = null;
    setStatus("Timer reset");
  }

  function handleSwitchMode(next) {
    setRunning(false);
    setMode(next);
    setSecondsLeft(durations[next]);
    setEditValue(formatTime(durations[next]));
    endTimeRef.current = null;
    setStatus(`Switched to ${MODES[next].label}`);
  }

  function handleSkip() {
    const upcomingMode = nextMode(mode);
    setRunning(false);
    setMode(upcomingMode);
    setSecondsLeft(durations[upcomingMode]);
    setEditValue(formatTime(durations[upcomingMode]));
    endTimeRef.current = null;
    setStatus(`Skipped. Now in ${MODES[upcomingMode].label}.`);
  }

  function handleDurationCommit() {
    if (running) return;

    const parsedSeconds = parseDurationInput(editValue);
    if (!parsedSeconds) {
      setEditValue(formatTime(secondsLeft));
      setStatus("Invalid duration. Use mm:ss or minutes.");
      return;
    }

    setDurations((current) => ({ ...current, [mode]: parsedSeconds }));
    setSecondsLeft(parsedSeconds);
    setEditValue(formatTime(parsedSeconds));
    setStatus(`${MODES[mode].label} duration updated.`);
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.kicker}>Focus Studio</p>
          <h1 className={styles.title}>Pomodoro Clock</h1>
          <p className={styles.subtitle}>Edit duration directly in the dial and press Enter to apply.</p>
        </header>

        <div className={styles.modeTabs}>
          {Object.entries(MODES).map(([key, details]) => (
            <button
              key={key}
              type="button"
              className={`${styles.modeTab} ${mode === key ? styles.modeTabActive : ""}`}
              onClick={() => handleSwitchMode(key)}
            >
              {details.label}
            </button>
          ))}
        </div>

        <div className={styles.timerWrap}>
          <div className={styles.clockFace}>
            <div className={styles.clockTicks} />
            <svg className={styles.ringSvg} viewBox="0 0 300 300" role="presentation" aria-hidden="true">
              <circle className={styles.ringBase} cx="150" cy="150" r={TIMER_RADIUS} />
              <circle
                className={styles.ringProgress}
                cx="150"
                cy="150"
                r={TIMER_RADIUS}
                strokeDasharray={TIMER_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div
              className={styles.handWrap}
              style={{ transform: `translate(-50%, -100%) rotate(${handRotation}deg)` }}
            >
              <div className={styles.hand} />
            </div>
            <div className={styles.clockCenter}>
              <p className={styles.modeLabel}>{MODES[mode].label}</p>
              <input
                className={styles.timerInput}
                value={running ? formatTime(secondsLeft) : editValue}
                onChange={(e) => setEditValue(sanitizeDurationInput(e.target.value))}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  setEditValue(sanitizeDurationInput(pasted));
                }}
                onBlur={handleDurationCommit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                disabled={running}
                aria-label="Pomodoro duration"
                inputMode="numeric"
                pattern="[0-9:]*"
                autoComplete="off"
                spellCheck={false}
                placeholder="25:00"
              />
              <p className={styles.editHint}>{running ? "Timer running" : "Edit mm:ss or minutes"}</p>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.primaryBtn} onClick={handleStartPause}>
            {running ? "Pause" : "Start"}
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={handleReset}>
            Reset
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={handleSkip}>
            Skip
          </button>
        </div>

        <div className={styles.metaRow}>
          <p className={styles.status}>{status}</p>
          <p className={styles.count}>Pomodoros done: {completedPomodoros}</p>
        </div>
      </section>
    </main>
  );
}
