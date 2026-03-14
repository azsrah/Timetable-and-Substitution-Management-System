import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, BookOpen, Calendar, 
  Settings, LogOut, Clock, 
  Bell, FileText, Activity, Megaphone, BarChart2
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', icon: Activity, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
    { to: '/admin/classes', icon: BookOpen, label: 'Classes & Subjects' },
    { to: '/admin/timetable', icon: Calendar, label: 'Timetable Editor' },
    { to: '/admin/substitutions', icon: Clock, label: 'Substitutions' },
    { to: '/admin/resources', icon: FileText, label: 'Resource Approvals' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: Activity, label: 'Overview' },
    { to: '/teacher/timetable', icon: Calendar, label: 'My Timetable' },
    { to: '/teacher/requests', icon: FileText, label: 'Resource Requests' },
    { to: '/teacher/substitutions', icon: Clock, label: 'Substitutions' },
    { to: '/teacher/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/teacher/settings', icon: Settings, label: 'Settings' },
  ];

  const studentLinks = [
    { to: '/student', icon: Activity, label: 'Overview' },
    { to: '/student/timetable', icon: Calendar, label: 'Class Timetable' },
    { to: '/student/announcements', icon: Megaphone, label: 'Announcements' },
  ];

  let links = [];
  if (user?.role === 'Admin') links = adminLinks;
  else if (user?.role === 'Teacher') links = teacherLinks;
  else if (user?.role === 'Student') links = studentLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full shadow-xl">
      <div className="p-6 text-2xl font-bold border-b border-slate-700 flex items-center gap-2 text-indigo-400">
        <Calendar size={28} />
        <span>SMS</span>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/teacher' || link.to === '/student'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <link.icon size={20} />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
