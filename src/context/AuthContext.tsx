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
      .then(r => {
        const userData: UserOut = r.data;
        // Migração: se usuário passou pelo onboarding antigo (bf_onboarded no localStorage)
        // mas o backend ainda não marcou onboarding_completed, marcar silenciosamente
        if (!userData.onboarding_completed && localStorage.getItem('bf_onboarded')) {
          api.post('/auth/me/onboarding', {}).catch(() => {});
          userData.onboarding_completed = true;
        }
        setUser(userData);
      })
      .catch(() => localStorage.removeItem('bf_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token: string, userData: UserOut) {
    localStorage.setItem('bf_token', token);
    // Migração: usuário que fez onboarding no sistema antigo (localStorage)
    // não deve ser redirecionado para /onboarding novamente
    if (!userData.onboarding_completed && localStorage.getItem('bf_onboarded')) {
      api.post('/auth/me/onboarding', {}).catch(() => {});
      userData = { ...userData, onboarding_completed: true };
    }
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
