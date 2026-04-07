import { useState } from "react";
import CreateGroup from "../components/CreateGroup";
import JoinGroup from "../components/JoinGroup";
import GroupList from "../components/GroupList";
import ToastStack from "../components/ToastStack";

export default function GroupsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState([]);

  const notify = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 via-cyan-50 to-white px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Groups</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Create a team, share your 6-character code, and collaborate with your circle.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CreateGroup onGroupCreated={triggerRefresh} onNotify={notify} />
          <JoinGroup onGroupJoined={triggerRefresh} onNotify={notify} />
        </section>

        <section>
          <GroupList refreshKey={refreshKey} onNotify={notify} />
        </section>
      </div>

      <ToastStack toasts={toasts} onClose={dismissToast} />
    </main>
  );
}
