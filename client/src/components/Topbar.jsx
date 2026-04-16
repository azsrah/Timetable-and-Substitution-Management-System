import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, User, X, Check, Settings, LogOut, ChevronDown } from 'lucide-react';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, clearNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm relative z-40">
      <div className="text-xl font-semibold text-gray-800">
        Welcome back, <span className="text-indigo-600">{user?.name}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className={`p-2 rounded-full transition relative ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">You have {unreadCount} unread messages</p>
                </div>
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} title="Mark all as read" className="text-gray-400 hover:text-indigo-600 transition">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={clearNotifications} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition">Clear all</button>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <Bell size={20} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">No new notifications</p>
                  </div>
                ) : (
                  notifications?.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`px-5 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer group flex items-start gap-3 ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-indigo-600' : 'bg-transparent'}`} />
                      <div className="flex-grow">
                        <p className={`text-sm leading-tight mb-1 ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.message}</p>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {n.created_at ? new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className={`flex items-center gap-3 p-1.5 pr-3 rounded-full transition-all duration-200 border ${showProfileMenu ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-gray-50 border-transparent'}`}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-tighter opacity-70">
                {user?.role === 'Student' && user?.grade ? `Grade ${user.grade}${user.section}` : user?.role}
              </span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Account</p>
                <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
              </div>
              
              <Link 
                to={`/${user?.role?.toLowerCase()}/settings`}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Settings size={18} />
                <span className="font-medium">Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm text-rose-500 hover:bg-rose-50 transition-colors border-t border-gray-50 mt-1"
              >
                <LogOut size={18} />
                <span className="font-bold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

