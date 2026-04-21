// ─────────────────────────────────────────────────────────
// AuthContext.jsx — Global Authentication State
// Provides login, logout, and current user data to the
// entire application via React Context.
//
// How it works:
//  - On first load, checks if a token exists in localStorage
//    and fetches the user's profile from the server to restore
//    the session without forcing a re-login.
//  - Exposes: user, login(), logout(), loading
// ─────────────────────────────────────────────────────────

import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Create the context object — components use useAuth() to access it
const AuthContext = createContext(null);

// AuthProvider wraps the whole app so every component can access auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // The logged-in user object (or null if logged out)
  const [loading, setLoading] = useState(true); // Prevents rendering the app before auth is checked

  // On first mount: check if a token is saved and restore the user session
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Ask the backend for the current user's profile using the saved token
          const { data } = await api.get('/auth/me');
          setUser(data); // Restore user state
        } catch (err) {
          console.error('Initial auth fetch failed', err);
          // Token is invalid or expired — clean it up and force re-login
          localStorage.removeItem('token');
        }
      }
      setLoading(false); // Auth check is done — allow the app to render
    };
    fetchMe();
  }, []);

  // login — sends credentials to the server, saves the JWT, and stores the user
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token); // Persist token for future page loads
    setUser(data.user);                        // Update state so the UI refreshes immediately
    return data.user;                          // Return user so Login.jsx can redirect by role
  };

  // logout — removes the token from storage and clears user state
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null); // Triggers a re-render, sending the user to the login/landing page
  };

  return (
    // Share user, login, logout, and loading with all child components
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children} {/* Don't render anything until auth check is complete */}
    </AuthContext.Provider>
  );
};

// Custom hook — shortcut to access auth context in any component
// Usage: const { user, login, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);
