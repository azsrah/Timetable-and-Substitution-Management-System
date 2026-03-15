import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';

import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import ClassSubjectManagement from './pages/admin/ClassSubjectManagement';
import TimetableEditor from './pages/admin/TimetableEditor';
import ResourceApprovals from './pages/admin/ResourceApprovals';
import AdminSubstitutions from './pages/admin/AdminSubstitutions';
import AdminReports from './pages/admin/AdminReports';
import SubstitutionReports from './pages/admin/SubstitutionReports';

import TeacherOverview from './pages/teacher/TeacherOverview';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import ResourceRequests from './pages/teacher/ResourceRequests';
import TeacherSubstitutions from './pages/teacher/TeacherSubstitutions';
import TeacherSettings from './pages/teacher/TeacherSettings';

import StudentOverview from './pages/student/StudentOverview';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentSettings from './pages/student/StudentSettings';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Announcements from './pages/shared/Announcements';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <div>Unauthorized</div>;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    )
  }

  return (
    <NotificationProvider>
      <Routes>
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['Admin']}><ClassSubjectManagement /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['Admin']}><TimetableEditor /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute allowedRoles={['Admin']}><ResourceApprovals /></ProtectedRoute>} />
        <Route path="/admin/substitutions" element={<ProtectedRoute allowedRoles={['Admin']}><AdminSubstitutions /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['Admin']}><Announcements /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['Admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/reports/substitutions" element={<ProtectedRoute allowedRoles={['Admin']}><SubstitutionReports /></ProtectedRoute>} />
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherOverview /></ProtectedRoute>} />
        <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherTimetable /></ProtectedRoute>} />
        <Route path="/teacher/requests" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><ResourceRequests /></ProtectedRoute>} />
        <Route path="/teacher/substitutions" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherSubstitutions /></ProtectedRoute>} />
        <Route path="/teacher/announcements" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><Announcements /></ProtectedRoute>} />
        <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherSettings /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute allowedRoles={['Student']}><StudentOverview /></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['Student']}><StudentTimetable /></ProtectedRoute>} />
        <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['Student']}><Announcements /></ProtectedRoute>} />
        <Route path="/student/settings" element={<ProtectedRoute allowedRoles={['Student']}><StudentSettings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={`/${user.role.toLowerCase()}`} />} />
      </Routes>
    </NotificationProvider>
  );
};

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
