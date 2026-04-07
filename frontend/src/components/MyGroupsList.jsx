import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { groupService } from "../api/groupService";

function getMemberUserId(member) {
  if (!member?.userId) return "";
  if (typeof member.userId === "string") return member.userId;
  if (typeof member.userId === "object") {
    return member.userId._id ? String(member.userId._id) : String(member.userId);
  }
  return String(member.userId);
}

function getRoleBadgeClass(role) {
  if (role === "Guild Master") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }

  if (role === "Veteran") {
    return "bg-sky-100 text-sky-800 border-sky-300";
  }

  return "bg-slate-100 text-slate-700 border-slate-300";
}

export default function MyGroupsList({ refreshKey = 0, onNotify }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await groupService.getMyGroups();
        if (isMounted) {
          setGroups(response.data.groups || []);
        }
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

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">My Guilds</h2>

      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading your guilds...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {!isLoading && !error && groups.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">You have not joined any guilds yet.</p>
      )}

      {!isLoading && !error && groups.length > 0 && (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {groups.map((group) => {
            const currentMember = group.members?.find(
              (member) => getMemberUserId(member) === String(user?.id)
            );

            const role = currentMember?.role || "Novice";

            return (
              <li key={group._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {group.description || "No guild description provided."}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getRoleBadgeClass(role)}`}
                  >
                    {role}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span>Code: {group.joinCode}</span>
                  <span>{group.isPublic ? "Public" : "Private"}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}