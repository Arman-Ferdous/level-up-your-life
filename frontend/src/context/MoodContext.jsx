import { createContext, useState, useCallback, useEffect } from "react";
import { api } from "../api/axios";

export const MoodContext = createContext();

export function MoodProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch mood history for the last 30 days.
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/api/mood/history", { params: { days: 30 } });
      setHistory(res.data.entries ?? []);
      setHistoryError(null);
    } catch (e) {
      setHistoryError(e?.response?.data?.message ?? "Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <MoodContext.Provider value={{ history, historyError, historyLoading, fetchHistory }}>
      {children}
    </MoodContext.Provider>
  );
}
