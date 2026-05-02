import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { MoodProvider } from "./context/MoodContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MoodPage from "./pages/MoodPage";
import ExpenseTrackerPage from "./pages/ExpenseTrackerPage";
import TasksPage from "./pages/TasksPage";
import PomodoroPage from "./pages/PomodoroPage";
import ChallengesPage from "./pages/ChallengesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import GroupsPage from "./pages/GroupsPage";
import CalendarPage from "./pages/CalendarPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ThemeSelectionPage from "./pages/ThemeSelectionPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ margin: 40 }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ margin: 40 }}>Loading...</div>;
  return !user ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ margin: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "admin" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <NotificationProvider>
      <MoodProvider>
        <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/pomodoro" element={<ProtectedRoute><PomodoroPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/mood" element={<ProtectedRoute><MoodPage /></ProtectedRoute>} />
        <Route path="/expense-tracker" element={<ProtectedRoute><ExpenseTrackerPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/settings/theme" element={<ProtectedRoute><ThemeSelectionPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MoodProvider>
    </NotificationProvider>
  );
}

export default App;
