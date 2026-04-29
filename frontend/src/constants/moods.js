export const MOODS = [
  { id: 1, value: "terrible", emoji: "😭", label: "Terrible" },
  { id: 2, value: "bad", emoji: "😞", label: "Bad" },
  { id: 3, value: "meh", emoji: "😐", label: "Neutral" },
  { id: 4, value: "okay", emoji: "🙂", label: "Okay" },
  { id: 5, value: "good", emoji: "😊", label: "Good" },
  { id: 6, value: "great", emoji: "🤩", label: "Great" },
];

export const EMOJI_LIST = MOODS.map((m) => m.emoji);
