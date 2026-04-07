import { useEffect, useState } from "react";
import { groupService } from "../api/groupService";
import TodoList from "./TodoList";

export default function GroupTaskManager({ refreshKey = 0, onNotify }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await groupService.getMyGroups();
        const nextGroups = response.data.groups || [];

        if (!isMounted) {
          return;
        }

        setGroups(nextGroups);
        setSelectedGroupId((current) => {
          if (nextGroups.length === 0) {
            return "";
          }

          const stillValid = nextGroups.some((group) => group._id === current);
          return stillValid ? current : nextGroups[0]._id;
        });
      } catch (err) {
        if (isMounted) {
          const message = err?.response?.data?.message || "Failed to load your guilds.";
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

  const selectedGroup = groups.find((group) => group._id === selectedGroupId) || null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Group Tasks</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose a guild, then create and manage tasks with the same workflow as your personal task list.
          </p>
        </div>

        <div className="min-w-60">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Select Guild
          </label>
          <select
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            disabled={isLoading || groups.length === 0}
          >
            {groups.length === 0 ? (
              <option value="">No joined guilds available</option>
            ) : (
              groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading guilds...</p>}
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {!isLoading && !error && groups.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Join a guild first, then come back here to manage its tasks.
        </div>
      )}

      {!isLoading && !error && selectedGroup && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-900">{selectedGroup.name}</p>
              <p className="text-sm text-slate-600">
                {selectedGroup.description || "No guild description provided."}
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {selectedGroup.isPublic ? "Public" : "Private"}
            </div>
          </div>

          <TodoList groupId={selectedGroupId} groupName={selectedGroup.name} />
        </div>
      )}
    </section>
  );
}