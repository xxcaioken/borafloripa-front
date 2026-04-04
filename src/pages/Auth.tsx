import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Google Identity Services (GSI) types — loaded dynamically
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function initGoogle() {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: async ({ credential }) => {
          setGoogleLoading(true);
          try {
            const { data } = await api.post('/auth/google', { credential });
            login(data.access_token, data.user);
            onClose?.();
          } catch {
            // handled silently — user stays on form
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 300,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    }

    if (window.google) {
      initGoogle();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID]);

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

          {tab !== 'forgot' && GOOGLE_CLIENT_ID && (
            <>
              <div className="auth-divider">ou</div>
              <div
                ref={googleBtnRef}
                style={{ minHeight: 44, opacity: googleLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}
                aria-label="Entrar com Google"
              />
            </>
          )}

          {tab !== 'forgot' && (
            <button className="auth-skip" onClick={onClose}>Continuar sem conta</button>
          )}
        </div>
      </div>
    </div>
  );
}
