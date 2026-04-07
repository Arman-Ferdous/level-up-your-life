import { useState } from "react";
import { groupService } from "../api/groupService";

export default function JoinGroup({ onGroupJoined, onNotify }) {
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedCode = joinCode.trim().toLowerCase();
    if (normalizedCode.length !== 6) {
      onNotify?.("Join code must be exactly 6 characters.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await groupService.joinGroup(normalizedCode);
      onNotify?.(response.data.message || "Joined group successfully.", "success");
      setJoinCode("");
      if (onGroupJoined) onGroupJoined(response.data.group);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      onNotify?.(apiMessage || "Could not join the group.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Join Group</h2>
      <p className="mt-1 text-sm text-slate-600">Enter a 6-character code shared by another member.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          maxLength={6}
          placeholder="e.g. ab991c"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 outline-none ring-0 transition focus:border-slate-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Joining..." : "Join Group"}
        </button>
      </form>
    </section>
  );
}
