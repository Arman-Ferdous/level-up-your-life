import { useEffect, useState } from "react";
import { groupService } from "../api/groupService";

export default function DiscoveryTab({ refreshKey = 0, onGroupJoined, onNotify }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningCode, setJoiningCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await groupService.discoverGroups();
        if (isMounted) {
          setGroups(response.data.groups || []);
        }
      } catch (err) {
        if (isMounted) {
          const message = err?.response?.data?.message || "Failed to load public guilds.";
          setError(message);
          onNotify?.(message, "error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, [refreshKey, onNotify]);

  const handleJoin = async (group) => {
    try {
      setJoiningCode(group.joinCode);
      const response = await groupService.joinGroup(group.joinCode);
      setGroups((prev) => prev.filter((item) => item._id !== group._id));
      onNotify?.(response.data.message || `Joined ${group.name}.`, "success");
      onGroupJoined?.(response.data.group);
    } catch (err) {
      const message = err?.response?.data?.message || "Could not join the guild.";
      onNotify?.(message, "error");
    } finally {
      setJoiningCode("");
    }
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Discovery Tab</h2>
          <p className="mt-1 text-sm text-slate-600">Browse public guilds and join them instantly.</p>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading public guilds...</p>}
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {!isLoading && !error && groups.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No public guilds are available right now.</p>
      )}

      {!isLoading && !error && groups.length > 0 && (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <li
              key={group._id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-300 hover:bg-amber-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{group.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {group.description || "No guild description provided."}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Public
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleJoin(group)}
                disabled={joiningCode === group.joinCode}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joiningCode === group.joinCode ? "Joining..." : "Join Guild"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}