import { useState } from "react";
import CreateGroup from "../components/CreateGroup";
import JoinGroup from "../components/JoinGroup";
import DiscoveryTab from "../components/DiscoveryTab";
import MyGroupsList from "../components/MyGroupsList";
import ToastStack from "../components/ToastStack";

export default function GroupsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("my-guilds");
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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Guilds</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Create a guild, share your 6-character code, or discover public guilds to join.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CreateGroup onGroupCreated={triggerRefresh} onNotify={notify} />
          <JoinGroup onGroupJoined={triggerRefresh} onNotify={notify} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-3 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("my-guilds")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "my-guilds"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              My Guilds
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "discover"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Discovery
            </button>
          </div>

          <div className="p-3">
            {activeTab === "my-guilds" ? (
              <MyGroupsList refreshKey={refreshKey} onNotify={notify} />
            ) : (
              <DiscoveryTab refreshKey={refreshKey} onGroupJoined={triggerRefresh} onNotify={notify} />
            )}
          </div>
        </section>
      </div>

      <ToastStack toasts={toasts} onClose={dismissToast} />
    </main>
  );
}
