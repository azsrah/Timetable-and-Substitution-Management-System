// ─────────────────────────────────────────────────────────
// NotificationContext.jsx — Real-time & Persistent Notifications
//
// This context manages TWO types of notifications:
//   1. Toasts — temporary pop-ups (e.g. "Substitution accepted!")
//      that slide in from the top-right and auto-dismiss after 5 seconds.
//   2. Persistent notifications — stored in the database and shown
//      in the bell icon dropdown (notification inbox).
//
// Uses Socket.io to listen for real-time events from the server.
// ─────────────────────────────────────────────────────────

import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);                           // The active Socket.io connection
  const [toasts, setToasts] = useState([]);                             // Short-lived pop-up notifications
  const [persistentNotifications, setPersistentNotifications] = useState([]); // Inbox notifications from DB
  const { user } = useAuth();

  // ── fetchNotifications ──────────────────────────────────
  // Loads the user's notification inbox from the database.
  // Called on mount and whenever a real-time socket event arrives.
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setPersistentNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // ── Socket Setup + Event Listeners ─────────────────────
  // Runs when the user logs in or changes. Sets up the socket connection
  // and subscribes to all relevant notification event channels.
  useEffect(() => {
    fetchNotifications(); // Load inbox on mount

    // Connect to the Socket.io server
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002');
    setSocket(newSocket);

    if (user) {
      // Listen for notifications addressed specifically to this user (by user ID)
      newSocket.on(`notification_${user.id}`, (data) => {
        addToast({ ...data, type: 'info', icon: 'info' }); // Show a pop-up toast
        fetchNotifications(); // Refresh the inbox to include the new notification
      });

      // Students also listen for class-wide notifications (e.g. substitution alerts)
      if (user.role === 'Student' && user.class_id) {
        newSocket.on(`notification_class_${user.class_id}`, (data) => {
          addToast({ ...data, type: 'info', title: 'Class Update', icon: 'info' });
          fetchNotifications();
        });
      }
    }

    // Everyone listens for global timetable update events
    newSocket.on('timetable_updated', (data) => {
      addToast({ 
        message: `Timetable updated for Class ${data.class_id}`, 
        type: 'info',
        icon: 'info'
      });
      fetchNotifications();
    });

    // Admins get notified in real-time when a substitution is accepted
    newSocket.on('substitution_accepted', (data) => {
      if (user && user.role === 'Admin') {
        addToast({ 
          message: data.message, 
          type: 'success', 
          title: 'Admin Alert',
          icon: 'check'
        });
        fetchNotifications();
      }
    });

    // Admins refresh their inbox when a new resource request comes in
    // The targeted toast is handled by the notification_${user.id} event above
    newSocket.on('new_resource_request', (data) => {
      if (user && user.role === 'Admin') {
        fetchNotifications();
      }
    });

    // Clean up the socket connection when the user logs out or the component unmounts
    return () => newSocket.close();
  }, [user]); // Re-run whenever the logged-in user changes

  // ── clearNotifications ──────────────────────────────────
  // Deletes all inbox notifications from the DB and clears local state.
  const clearNotifications = async () => {
    try {
      await api.delete('/notifications');
      setPersistentNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // ── markAsRead ──────────────────────────────────────────
  // Marks one notification as read in the DB and updates the local list
  // so the unread dot disappears without re-fetching everything.
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setPersistentNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // ── markAllAsRead ───────────────────────────────────────
  // Marks every notification as read in one batch API call.
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      // Optimistically update all local notifications without re-fetching
      setPersistentNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // ── removeToast ─────────────────────────────────────────
  // Removes a single toast from the pop-up list by its ID.
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  };

  // ── addToast ────────────────────────────────────────────
  // Adds a new toast pop-up and schedules its auto-removal after 5 seconds.
  const addToast = (notif) => {
    const id = Date.now(); // Use timestamp as a unique ID
    const newToast = { 
      ...notif, 
      id, 
      createdAt: new Date(),
      type: notif.type || 'info' // Default to info style if no type is given
    };
    
    setToasts((prev) => [newToast, ...prev]); // Add to the top of the list
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  // ── getIcon ─────────────────────────────────────────────
  // Returns the correct Lucide icon component based on notification type.
  const getIcon = (iconType, type) => {
    switch (iconType || type) {
      case 'success':
      case 'check':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'error':
      case 'x':
        return <XCircle className="text-rose-500" size={20} />;
      case 'warning':
      case 'alert':
        return <AlertTriangle className="text-amber-500" size={20} />;
      default:
        return <Info className="text-indigo-500" size={20} />; // Default: info blue
    }
  };

  // ── getTypeStyles ───────────────────────────────────────
  // Returns Tailwind CSS classes for the toast background/border based on type.
  const getTypeStyles = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-100 text-emerald-900 shadow-emerald-100/50';
      case 'error':   return 'bg-rose-50 border-rose-100 text-rose-900 shadow-rose-100/50';
      case 'warning': return 'bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/50';
      default:        return 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-indigo-100/50';
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      socket, 
      notifications: persistentNotifications,  // Inbox notifications (from DB)
      toasts,                                   // Real-time pop-up toasts
      clearNotifications, 
      addNotification: addToast,                // Expose addToast as addNotification
      removeNotification: removeToast,
      markAsRead,
      markAllAsRead,
      fetchNotifications
    }}>
      {children}

      {/* ── Toast Pop-up UI ──────────────────────────────── */}
      {/* Fixed to the top-right corner, stacked vertically */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 min-w-[320px] max-w-[420px]">
        {toasts.map((n) => (
          <div 
            key={n.id} 
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-500 animate-[slideIn_0.3s_ease-out] ${getTypeStyles(n.type)}`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(n.icon, n.type)}
            </div>
            {/* Title and message */}
            <div className="flex-grow mr-2">
              {n.title && <h4 className="text-sm font-black mb-0.5 uppercase tracking-wider opacity-80">{n.title}</h4>}
              <p className="text-sm font-medium leading-relaxed">{n.message}</p>
            </div>
            {/* Dismiss button */}
            <button 
              onClick={() => removeToast(n.id)}
              className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-0.5 hover:bg-black/5 rounded-md"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Slide-in animation for toasts */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

// Custom hook — shortcut to consume the notification context
// Usage: const { notifications, addNotification } = useNotifications();
export const useNotifications = () => useContext(NotificationContext);
