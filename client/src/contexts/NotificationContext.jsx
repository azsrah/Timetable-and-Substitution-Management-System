import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [persistentNotifications, setPersistentNotifications] = useState([]);
  const { user } = useAuth();

  // Fetch persistent notifications on mount or user change
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setPersistentNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002');
    setSocket(newSocket);

    if (user) {
      // User-specific notifications
      newSocket.on(`notification_${user.id}`, (data) => {
        addToast({ ...data, type: 'info', icon: 'info' });
        fetchNotifications(); // Refresh inbox
      });

      // Class-specific notifications (for students)
      if (user.role === 'Student' && user.class_id) {
        newSocket.on(`notification_class_${user.class_id}`, (data) => {
          addToast({ ...data, type: 'info', title: 'Class Update', icon: 'info' });
          fetchNotifications(); // Refresh inbox
        });
      }
    }

    // Global notifications like timetable changes
    newSocket.on('timetable_updated', (data) => {
      addToast({ 
        message: `Timetable updated for Class ${data.class_id}`, 
        type: 'info',
        icon: 'info'
      });
      fetchNotifications(); // Refresh inbox
    });

    newSocket.on('substitution_accepted', (data) => {
      if (user && user.role === 'Admin') {
        addToast({ 
          message: data.message, 
          type: 'success', 
          title: 'Admin Alert',
          icon: 'check'
        });
        fetchNotifications(); // Refresh inbox
      }
    });

    newSocket.on('new_resource_request', (data) => {
      if (user && user.role === 'Admin') {
        // Just refresh the inbox database records
        // The real-time toast is handled by the targeted notification_${user.id} event
        fetchNotifications();
      }
    });


    return () => newSocket.close();
  }, [user]);

  const clearNotifications = async () => {
    try {
      await api.delete('/notifications');
      setPersistentNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

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

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setPersistentNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  };

  const addToast = (notif) => {
    const id = Date.now();
    const newToast = { 
      ...notif, 
      id, 
      createdAt: new Date(),
      type: notif.type || 'info'
    };
    
    setToasts((prev) => [newToast, ...prev]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

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
        return <Info className="text-indigo-500" size={20} />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100 text-emerald-900 shadow-emerald-100/50';
      case 'error':
        return 'bg-rose-50 border-rose-100 text-rose-900 shadow-rose-100/50';
      case 'warning':
        return 'bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/50';
      default:
        return 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-indigo-100/50';
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      socket, 
      notifications: persistentNotifications, 
      toasts,
      clearNotifications, 
      addNotification: addToast, 
      removeNotification: removeToast,
      markAsRead,
      markAllAsRead,
      fetchNotifications
    }}>
      {children}
      {/* Toast UI */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 min-w-[320px] max-w-[420px]">
        {toasts.map((n) => (
          <div 
            key={n.id} 
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-sm transition-all duration-500 animate-[slideIn_0.3s_ease-out] ${getTypeStyles(n.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(n.icon, n.type)}
            </div>
            <div className="flex-grow mr-2">
              {n.title && <h4 className="text-sm font-black mb-0.5 uppercase tracking-wider opacity-80">{n.title}</h4>}
              <p className="text-sm font-medium leading-relaxed">{n.message}</p>
            </div>
            <button 
              onClick={() => removeToast(n.id)}
              className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity p-0.5 hover:bg-black/5 rounded-md"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

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

export const useNotifications = () => useContext(NotificationContext);

