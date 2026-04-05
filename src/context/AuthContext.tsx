import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { UserOut } from '../services/api';

interface AuthContextType {
  user: UserOut | null;
  loading: boolean;
  login: (token: string, userData: UserOut) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
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

  function login(token: string, userData: UserOut) {
    localStorage.setItem('bf_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('bf_token');
    setUser(null);
  }

  function refreshUser(): Promise<void> {
    return api.get('/auth/me').then(r => setUser(r.data));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) as AuthContextType;
