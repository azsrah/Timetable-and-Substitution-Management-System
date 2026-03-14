import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import React, { useState } from 'react';

import Layout from './components/Layout';

// Basic Placeholders for Pages
const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl shadow-slate-200 w-96 text-center border border-slate-100">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">School System</h1>
        <p className="text-slate-500 mb-6 text-sm">Please sign in to your account</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="text-left">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <input className="w-full border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="email@school.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="text-left">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <input className="w-full border border-slate-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-2">
            Login
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-sm">
          <Link to="/forgot-password" title="Click here to reset your password"  className="text-indigo-600 font-bold hover:underline">Forgot Password?</Link>
          <div className="text-slate-500">
            <span>New student? </span>
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import ClassSubjectManagement from './pages/admin/ClassSubjectManagement';
import TimetableEditor from './pages/admin/TimetableEditor';
import ResourceApprovals from './pages/admin/ResourceApprovals';
import AdminSubstitutions from './pages/admin/AdminSubstitutions';
import AdminReports from './pages/admin/AdminReports';

import TeacherOverview from './pages/teacher/TeacherOverview';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import ResourceRequests from './pages/teacher/ResourceRequests';
import TeacherSubstitutions from './pages/teacher/TeacherSubstitutions';
import TeacherSettings from './pages/teacher/TeacherSettings';

import StudentOverview from './pages/student/StudentOverview';
import StudentTimetable from './pages/student/StudentTimetable';
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
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
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
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherOverview /></ProtectedRoute>} />
        <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherTimetable /></ProtectedRoute>} />
        <Route path="/teacher/requests" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><ResourceRequests /></ProtectedRoute>} />
        <Route path="/teacher/substitutions" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherSubstitutions /></ProtectedRoute>} />
        <Route path="/teacher/announcements" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><Announcements /></ProtectedRoute>} />
        <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin']}><TeacherSettings /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute allowedRoles={['Student']}><StudentOverview /></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['Student']}><StudentTimetable /></ProtectedRoute>} />
        <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['Student']}><Announcements /></ProtectedRoute>} />
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
