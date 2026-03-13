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

  return (
    <NotificationContext.Provider value={{ socket, notifications, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
