import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Auth({ onClose, initialTab = 'login', prefMusic, prefVibes }) {
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { name, email, password, pref_music: prefMusic, pref_vibes: prefVibes };
      const { data } = await api.post(endpoint, body);
      login(data.access_token, data.user);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet auth-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="auth-body">
          <div className="auth-logo">Bora <span>Floripa</span></div>

          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>
              Entrar
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {tab === 'register' && (
              <div className="auth-field">
                <label>Nome</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            <div className="auth-field">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="auth-field">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            {tab === 'register' && prefMusic && (
              <div className="auth-prefs-notice">
                ✅ Suas preferências do onboarding serão salvas no perfil
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button className="auth-skip" onClick={onClose}>
            Continuar sem conta
          </button>
        </div>
      </div>
    </div>
  );
}
