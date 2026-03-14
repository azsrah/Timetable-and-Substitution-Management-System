import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, User, X } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
      <div className="text-xl font-semibold text-gray-800">
        Welcome back, <span className="text-indigo-600">{user?.name}</span>
      </div>

      <div className="flex items-center gap-6 relative">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative"
          >
            <Bell size={22} />
            {notifications?.length > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-700">Notifications</h3>
                <button onClick={clearNotifications} className="text-xs text-indigo-600 hover:underline">Clear all</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications?.length === 0 ? (
                  <p className="text-gray-500 text-sm p-4 text-center">No new notifications</p>
                ) : (
                  notifications?.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                      <p className="text-sm text-gray-700 leading-tight mb-1">{n.message}</p>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            <span className="text-xs text-gray-500">{user?.role}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
