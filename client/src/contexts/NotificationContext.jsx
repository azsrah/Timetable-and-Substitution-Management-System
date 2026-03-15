import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002');
    setSocket(newSocket);

    if (user) {
      // User-specific notifications
      newSocket.on(`notification_${user.id}`, (data) => {
        addNotification({ ...data, type: 'info', icon: 'info' });
      });

      // Class-specific notifications (for students)
      if (user.role === 'Student' && user.class_id) {
        newSocket.on(`notification_class_${user.class_id}`, (data) => {
          addNotification({ ...data, type: 'info', title: 'Class Update', icon: 'info' });
        });
      }
    }

    // Global notifications like timetable changes
    newSocket.on('timetable_updated', (data) => {
      addNotification({ 
        message: `Timetable updated for Class ${data.class_id}`, 
        type: 'info',
        icon: 'info'
      });
    });

    newSocket.on('substitution_accepted', (data) => {
      if (user && user.role === 'Admin') {
        addNotification({ 
          message: data.message, 
          type: 'success', 
          title: 'Admin Alert',
          icon: 'check'
        });
      }
    });

    return () => newSocket.close();
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif) => {
    const id = Date.now();
    const newNotif = { 
      ...notif, 
      id, 
      createdAt: new Date(),
      type: notif.type || 'info'
    };
    
    setNotifications((prev) => [newNotif, ...prev]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
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
    <NotificationContext.Provider value={{ socket, notifications, clearNotifications, addNotification, removeNotification }}>
      {children}
      {/* Premium Toast UI */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 min-w-[320px] max-w-[420px]">
        {notifications.map((n) => (
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
              onClick={() => removeNotification(n.id)}
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
