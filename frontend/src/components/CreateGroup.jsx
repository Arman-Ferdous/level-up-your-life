import { useState } from "react";
import { groupService } from "../api/groupService";

export default function CreateGroup({ onGroupCreated, onNotify }) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const copyJoinCode = async () => {
    if (!joinCode || isCopying) return;

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(joinCode);
      onNotify?.("Join code copied to clipboard.", "success");
    } catch {
      onNotify?.("Could not copy code. Copy it manually.", "error");
    } finally {
      setIsCopying(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setJoinCode("");

    if (!name.trim()) {
      onNotify?.("Please enter a group name.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await groupService.createGroup({ name: name.trim() });
      const createdGroup = response.data.group;
      setJoinCode(createdGroup.joinCode);
      setName("");
      onNotify?.(`Group created. Share code ${createdGroup.joinCode}.`, "success");
      if (onGroupCreated) onGroupCreated(createdGroup);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create group.";
      onNotify?.(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Create Group</h2>
      <p className="mt-1 text-sm text-slate-600">Create a group and share its join code with friends.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-0 transition focus:border-slate-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Group"}
        </button>
      </form>

      {joinCode && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
          <p>
            Join code: <span className="font-mono font-semibold tracking-wider">{joinCode}</span>
          </p>
          <button
            type="button"
            onClick={copyJoinCode}
            disabled={isCopying}
            className="mt-3 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCopying ? "Copying..." : "Copy Code"}
          </button>
        </div>
      )}
    </section>
  );
}
