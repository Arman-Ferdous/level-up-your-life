import { useState } from "react";
import { groupService } from "../api/groupService";

export default function CreateGroup({ onGroupCreated, onNotify }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      onNotify?.("Please enter a guild name.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await groupService.createGroup({
        name: name.trim(),
        description: description.trim(),
        isPublic
      });

      const group = response.data.group;
      setCreatedGroup(group);
      setName("");
      setDescription("");
      setIsPublic(false);
      onNotify?.(`Guild created. Share code ${group.joinCode}.`, "success");
      onGroupCreated?.(group);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create guild.";
      onNotify?.(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-xl rounded-2xl border border-amber-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-xl shadow-slate-900/20">
      <h2 className="text-xl font-semibold text-white">Create Guild</h2>
      <p className="mt-1 text-sm text-slate-300">
        Forge a new guild, choose whether it is public, and share the join code with your party.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Guild Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example: The Midnight Adventurers"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your guild, quests, or weekly goals."
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-400"
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500 focus:ring-amber-400"
          />
          Make this a Public Guild
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Forging Guild..." : "Create Guild"}
        </button>
      </form>

      {createdGroup && (
        <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="text-sm font-medium">Guild created successfully</p>
          <p className="mt-2 text-sm text-emerald-50/90">
            Join code: <span className="font-mono text-base font-semibold">{createdGroup.joinCode}</span>
          </p>
        </div>
      )}
    </section>
  );
}
