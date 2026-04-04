import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Inicializa como true só se há token — evita setState síncrono no effect
  const [loading, setLoading] = useState(() => !!localStorage.getItem('bf_token'));

  useEffect(() => {
    const token = localStorage.getItem('bf_token');
    if (!token) return;
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('bf_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('bf_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('bf_token');
    setUser(null);
  }

  function refreshUser() {
    return api.get('/auth/me').then(r => setUser(r.data));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
