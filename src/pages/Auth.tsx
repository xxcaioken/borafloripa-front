import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AuthProps {
  onClose?: () => void;
  initialTab?: string;
  prefMusic?: string | null;
  prefVibes?: string | null;
}

export default function Auth({ onClose, initialTab = 'login', prefMusic, prefVibes }: AuthProps) {
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'forgot') {
        await api.post('/auth/forgot-password', { email });
        setForgotSent(true);
        return;
      }
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { name, email, password, pref_music: prefMusic, pref_vibes: prefVibes };
      const { data } = await api.post(endpoint, body);
      login(data.access_token, data.user);
      onClose?.();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Erro. Tente novamente.');
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

          {tab !== 'forgot' && (
            <div className="auth-tabs">
              <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
                Entrar
              </button>
              <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
                Criar conta
              </button>
            </div>
          )}

          {tab === 'forgot' && !forgotSent && (
            <div className="auth-forgot-header">
              <button className="auth-back-btn" onClick={() => { setTab('login'); setError(''); setForgotSent(false); }}>
                ← Voltar
              </button>
              <p className="auth-forgot-desc">Digite seu email e enviaremos um link para redefinir sua senha.</p>
            </div>
          )}

          {forgotSent ? (
            <div className="auth-sent">
              <div className="auth-sent-icon">📬</div>
              <p>Link enviado! Verifique sua caixa de entrada.</p>
              <p className="auth-sent-sub">O link expira em 1 hora.</p>
              <button className="btn-primary" onClick={onClose}>Fechar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {tab === 'register' && (
                <div className="auth-field">
                  <label>Nome</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
                </div>
              )}
              <div className="auth-field">
                <label>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              {tab !== 'forgot' && (
                <div className="auth-field">
                  <label>Senha</label>
                  <div className="auth-password-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button type="button" className="auth-pass-toggle" onClick={() => setShowPass(v => !v)}
                      aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              {tab === 'register' && prefMusic && (
                <div className="auth-prefs-notice">✅ Suas preferências do onboarding serão salvas no perfil</div>
              )}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : tab === 'register' ? 'Criar conta' : 'Enviar link'}
              </button>

              {tab === 'login' && (
                <button type="button" className="auth-forgot-link" onClick={() => { setTab('forgot'); setError(''); }}>
                  Esqueci minha senha
                </button>
              )}
            </form>
          )}

          {tab !== 'forgot' && (
            <button className="auth-skip" onClick={onClose}>Continuar sem conta</button>
          )}
        </div>
      </div>
    </div>
  );
}
