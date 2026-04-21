// ─────────────────────────────────────────────────────────
// App.jsx — Root Application Component & Routing
//
// This file defines:
//  - ProtectedRoute: a wrapper that checks authentication and role
//    before rendering a page, redirecting if not allowed
//  - AppRoutes: conditional routing logic that shows public routes
//    (login/register) when logged out, and role-based dashboards
//    when logged in
//  - App: wraps everything in AuthProvider and BrowserRouter
// ─────────────────────────────────────────────────────────

import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// ── Layout & Shared Components ─────────────────────────────
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';

// ── Admin Pages ────────────────────────────────────────────
import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import ClassSubjectManagement from './pages/admin/ClassSubjectManagement';
import TimetableEditor from './pages/admin/TimetableEditor';
import ResourceApprovals from './pages/admin/ResourceApprovals';
import AdminSubstitutions from './pages/admin/AdminSubstitutions';
import AdminReports from './pages/admin/AdminReports';
import SubstitutionReports from './pages/admin/SubstitutionReports';
import AdminAttendance from './pages/admin/AdminAttendance';
import AttendanceReports from './pages/admin/AttendanceReports';

// ── Teacher Pages ──────────────────────────────────────────
import TeacherOverview from './pages/teacher/TeacherOverview';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import ResourceRequests from './pages/teacher/ResourceRequests';
import TeacherSubstitutions from './pages/teacher/TeacherSubstitutions';
import ProfileSettings from './pages/shared/ProfileSettings';

// ── Student Pages ──────────────────────────────────────────
import StudentOverview from './pages/student/StudentOverview';
import StudentTimetable from './pages/student/StudentTimetable';

// ── Auth & Shared Pages ────────────────────────────────────
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Announcements from './pages/shared/Announcements';

// ── ProtectedRoute ─────────────────────────────────────────
// Wraps pages that require the user to be logged in.
// If the user is not logged in → redirect to /login
// If the user's role is not in allowedRoles → show "Unauthorized"
// If everything is fine → render the page inside the Layout shell
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <div>Unauthorized</div>;
  return <Layout>{children}</Layout>;
};

// ── AppRoutes ──────────────────────────────────────────────
// Decides which set of routes to show based on login state:
//   - Logged out: only public pages (landing, login, register, password reset)
//   - Logged in: full role-based app wrapped in NotificationProvider
const AppRoutes = () => {
  const { user } = useAuth();
  
  // Unauthenticated users only see public routes
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Any unknown URL redirects to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  // Authenticated users see all role-specific pages
  return (
    // NotificationProvider is inside here so socket connects only after login
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* ── Admin Routes ──────────────────────────────── */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['Admin']}><ClassSubjectManagement /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['Admin']}><TimetableEditor /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute allowedRoles={['Admin']}><ResourceApprovals /></ProtectedRoute>} />
        <Route path="/admin/substitutions" element={<ProtectedRoute allowedRoles={['Admin']}><AdminSubstitutions /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['Admin']}><AdminAttendance /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['Admin']}><Announcements /></ProtectedRoute>} />
        <Route path="/admin/reports/substitutions" element={<ProtectedRoute allowedRoles={['Admin']}><SubstitutionReports /></ProtectedRoute>} />
        <Route path="/admin/reports/attendance" element={<ProtectedRoute allowedRoles={['Admin']}><AttendanceReports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin']}><ProfileSettings /></ProtectedRoute>} />

        {/* ── Teacher Routes (Admins can also access these) ─ */}
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherOverview /></ProtectedRoute>} />
        <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherTimetable /></ProtectedRoute>} />
        <Route path="/teacher/requests" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><ResourceRequests /></ProtectedRoute>} />
        <Route path="/teacher/substitutions" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherSubstitutions /></ProtectedRoute>} />
        <Route path="/teacher/announcements" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><Announcements /></ProtectedRoute>} />
        <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><ProfileSettings /></ProtectedRoute>} />

        {/* ── Student Routes ─────────────────────────────── */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['Student']}><StudentOverview /></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['Student']}><StudentTimetable /></ProtectedRoute>} />
        <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['Student']}><Announcements /></ProtectedRoute>} />
        <Route path="/student/settings" element={<ProtectedRoute allowedRoles={['Student']}><ProfileSettings /></ProtectedRoute>} />

        {/* Unknown URLs redirect to the user's own dashboard */}
        <Route path="*" element={<Navigate to={`/${user.role.toLowerCase()}`} />} />
      </Routes>
    </NotificationProvider>
  );
};

// ── App ────────────────────────────────────────────────────
// The root component. Wraps everything in:
//  - AuthProvider: global authentication state
//  - Router: enables URL-based navigation
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
