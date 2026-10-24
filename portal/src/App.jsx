import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './lib/store';
import { homePath } from './lib/selectors';
import { AppLayout } from './components/AppLayout';

import Login from './pages/public/Login';
import Apply from './pages/public/Apply';
import SetPassword from './pages/public/SetPassword';
import { LoadingScreen } from './components/AppLayout';

import AdminDashboard from './pages/admin/Dashboard';
import Applications from './pages/admin/Applications';
import Members from './pages/admin/Members';
import Teams from './pages/admin/Teams';
import Attendance from './pages/admin/Attendance';
import Security from './pages/admin/Security';

import LeadDashboard from './pages/lead/Dashboard';
import MyTeam from './pages/lead/MyTeam';

import TasksPage from './pages/staff/Tasks';
import LeavesPage from './pages/staff/Leaves';
import AnnouncementsPage from './pages/staff/Announcements';

import MemberDashboard from './pages/member/Dashboard';
import MemberAttendance from './pages/member/Attendance';
import MemberTasks from './pages/member/Tasks';
import MemberLeave from './pages/member/Leave';
import MemberProgress from './pages/member/Progress';

function Home() {
  const { viewer, loading } = useStore();
  if (loading) return <LoadingScreen />;
  return <Navigate to={viewer ? homePath(viewer.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/set-password" element={<SetPassword />} />

      <Route path="/admin" element={<AppLayout role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="members" element={<Members />} />
        <Route path="teams" element={<Teams />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="security" element={<Security />} />
      </Route>

      <Route path="/lead" element={<AppLayout role="lead" />}>
        <Route index element={<LeadDashboard />} />
        <Route path="team" element={<MyTeam />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
      </Route>

      <Route path="/member" element={<AppLayout role="member" />}>
        <Route index element={<MemberDashboard />} />
        <Route path="attendance" element={<MemberAttendance />} />
        <Route path="tasks" element={<MemberTasks />} />
        <Route path="leave" element={<MemberLeave />} />
        <Route path="progress" element={<MemberProgress />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
