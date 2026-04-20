import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, BookOpen, Calendar, 
  Settings, LogOut, Clock, 
  Bell, FileText, Activity, Megaphone, BarChart2, UserCheck
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
    { to: '/admin/attendance', icon: UserCheck, label: 'Attendance' },
    { to: '/admin/substitutions', icon: Clock, label: 'Substitutions' },
    { to: '/admin/resources', icon: FileText, label: 'Resource Approvals' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/reports/attendance', icon: BarChart2, label: 'Attendance Reports' },
    { to: '/admin/reports/substitutions', icon: BarChart2, label: 'Substitution Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
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
    { to: '/student/settings', icon: Settings, label: 'Settings' },
  ];


  let links = [];
  if (user?.role === 'Admin') links = adminLinks;
  else if (user?.role === 'Teacher') links = teacherLinks;
  else if (user?.role === 'Student') links = studentLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen shadow-2xl sticky top-0 border-r border-slate-800">
      <div className="p-8 pb-6 text-2xl font-black flex items-center gap-3 text-indigo-400 shrink-0 relative group">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Calendar size={24} className="text-indigo-400" />
        </div>
        <span className="tracking-tight text-white">GMMS</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-1.5 custom-sidebar-scrollbar">
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
            <span className="font-semibold text-sm">{link.label}</span>
          </NavLink>
        ))}

        {/* Logout perfectly integrated under Settings */}
        <div className="pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 font-bold group"
          >
            <div className="group-hover:rotate-12 transition-transform">
              <LogOut size={20} />
            </div>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
