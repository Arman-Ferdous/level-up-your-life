// Compute pressure scores for pending tasks within a lookahead window.
// Exports: computePressureScores(tasks, options)

function pad(n) {
  return String(n).padStart(2, "0");
}

function getDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function computePressureScores(tasks = [], options = {}) {
  const { windowDays = 14, now = new Date() } = options;

  const weights = {
    low: 1,
    medium: 2,
    high: 3
  };

  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + windowDays + 1);

  const scores = Object.create(null);

  tasks.forEach((task) => {
    if (task.completed) return;
    if (!task.dueDate) return;

    const due = new Date(task.dueDate);
    // only include tasks within the lookahead window
    if (due < windowStart || due >= windowEnd) return;

    const dateKey = getDateKey(due);

    const daysUntil = Math.max(0, Math.ceil((new Date(due).setHours(0,0,0,0) - windowStart) / (1000 * 60 * 60 * 24)));

    const priorityRaw = (task.priority || "").toString().toLowerCase();
    const priorityWeight = weights[priorityRaw] || Number(task.priority) || 1;

    const urgencyFactor = 1 / (1 + daysUntil);

    let baseScore = priorityWeight * urgencyFactor;

    if (task.estimatedHours) {
      const hours = Number(task.estimatedHours) || 0;
      baseScore *= 1 + Math.min(hours / 8, 1);
    }

    scores[dateKey] = (scores[dateKey] || 0) + baseScore;
  });

  // return raw scores (caller can normalize)
  return scores;
}

export default computePressureScores;

export function computeSuggestions(tasks = [], normalizedScores = {}, options = {}) {
  const { now = new Date() } = options;

  // map dateKey -> tasks due on that day
  const byDate = Object.create(null);
  tasks.forEach((t) => {
    if (t.completed || !t.dueDate) return;
    const k = getDateKey(t.dueDate);
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(t);
  });

  const suggestions = Object.create(null);

  Object.keys(normalizedScores).forEach((dateKey) => {
    const norm = normalizedScores[dateKey] || 0;
    if (norm < 0.5) return; // only suggest for busy/hectic days

    const tasksOnDay = byDate[dateKey] || [];
    if (!tasksOnDay.length) return;

    // choose the highest-contributing task: prefer high priority and nearer due
    tasksOnDay.sort((a, b) => {
      const pa = (a.priority || "").toString().toLowerCase();
      const pb = (b.priority || "").toString().toLowerCase();
      const w = { high: 3, medium: 2, low: 1 };
      const wa = w[pa] || Number(a.priority) || 1;
      const wb = w[pb] || Number(b.priority) || 1;
      if (wa !== wb) return wb - wa;
      const da = Math.abs(new Date(a.dueDate) - new Date());
      const db = Math.abs(new Date(b.dueDate) - new Date());
      return da - db;
    });

    const top = tasksOnDay[0];

    // find an earlier day between today and dueDate with normalized score < 0.4
    const due = new Date(top.dueDate);
    const dayMs = 1000 * 60 * 60 * 24;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let suggestedDate = null;
    for (let d = new Date(today); d < due; d.setDate(d.getDate() + 1)) {
      const k = getDateKey(d);
      if ((normalizedScores[k] || 0) < 0.4) {
        suggestedDate = new Date(d);
        break;
      }
    }

    if (!suggestedDate) {
      // fallback to today if before due, else suggest the day before due
      if (today < due) suggestedDate = today;
      else {
        suggestedDate = new Date(due);
        suggestedDate.setDate(suggestedDate.getDate() - 1);
      }
    }

    suggestions[dateKey] = {
      task: top,
      suggestedDateKey: getDateKey(suggestedDate),
      suggestedDate: suggestedDate.toISOString().slice(0, 10)
    };
  });

  return suggestions;
}

