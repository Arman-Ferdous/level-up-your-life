import { useEffect, useState } from "react";
import { groupService } from "../api/groupService";

export default function GroupList({ refreshKey = 0, onNotify }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await groupService.getGroups();
        if (isMounted) {
          setGroups(response.data.groups || []);
        }
      } catch (err) {
        if (isMounted) {
          const message = err?.response?.data?.message || "Failed to load groups.";
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

  return (
    <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">My Groups</h2>

      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading groups...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {!isLoading && !error && groups.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">You have not joined any groups yet.</p>
      )}

      {!isLoading && !error && groups.length > 0 && (
        <ul className="mt-4 space-y-3">
          {groups.map((group) => (
            <li key={group._id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{group.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                Join code: <span className="font-mono">{group.joinCode}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
