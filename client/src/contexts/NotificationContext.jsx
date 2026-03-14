import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002');
    setSocket(newSocket);

    if (user) {
      newSocket.on(`notification_${user.id}`, (data) => {
        setNotifications((prev) => [data, ...prev]);
        // Also could trigger a toast here
        alert(`New Notification: ${data.message}`);
      });
    }

    // Global notifications like timetable changes
    newSocket.on('timetable_updated', (data) => {
      setNotifications((prev) => [{ message: `Timetable updated for Class ${data.class_id}` }, ...prev]);
    });

    return () => newSocket.close();
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  const addNotification = (notif) => {
    const id = Date.now();
    setNotifications((prev) => [{ ...notif, id, createdAt: new Date() }, ...prev]);
    
    // Auto remove after 5 seconds if it's a transient UI notification
    if (notif.type) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    }
  };

  return (
    <NotificationContext.Provider value={{ socket, notifications, clearNotifications, addNotification }}>
      {children}
      {/* Basic Toast UI */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.filter(n => n.type).map((n) => (
          <div 
            key={n.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border animate-in slide-in-from-right-full transition-all duration-300 ${
              n.type === 'success' 
                ? 'bg-green-50 border-green-100 text-green-800' 
                : 'bg-red-50 border-red-100 text-red-800'
            }`}
          >
            <p className="text-sm font-bold">{n.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
