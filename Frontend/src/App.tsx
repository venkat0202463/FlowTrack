import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import KanbanBoard from './pages/KanbanBoard';
import ProjectDetails from './pages/ProjectDetails';
import TimelinePage from './pages/Timeline';
import InsightsPage from './pages/Insights';
import SettingsPage from './pages/Settings';
import BacklogPage from './pages/Backlog';
import SprintBoard from './pages/SprintBoard';
import BoardSettings from './pages/BoardSettings';
import ProfilePage from './pages/Profile';
import GlobalIssues from './pages/GlobalIssues';
import ManagementConsole from './components/ManagementConsole';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/reset-password" element={isAuthenticated() ? <ResetPasswordPage /> : <Navigate to="/login" />} />

        <Route path="/dashboard" element={isAuthenticated() ? (user?.passwordResetRequired ? <Navigate to="/reset-password" /> : <DashboardLayout />) : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="kanban-select" element={<Navigate to="/dashboard/projects" />} />
          <Route path="project-details/:id" element={<ProjectDetails />} />
          <Route path="project/:id" element={<KanbanBoard />} />
          <Route path="backlog/:id" element={<BacklogPage />} />
          <Route path="sprint-board/:id" element={<SprintBoard />} />
          <Route path="board-settings/:id" element={<BoardSettings />} />
          <Route path="roadmap/:id" element={<TimelinePage />} />
          <Route path="insights/:id" element={<InsightsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="issues" element={<GlobalIssues />} />
          <Route path="management-console" element={user?.role === 'MANAGER' ? <ManagementConsole /> : <Navigate to="/dashboard" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
