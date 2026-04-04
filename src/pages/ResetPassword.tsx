import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Link inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="auth-logo">Bora <span>Floripa</span></div>

        {done ? (
          <div className="auth-sent">
            <div className="auth-sent-icon">✅</div>
            <p>Senha redefinida com sucesso!</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Ir para o app
            </button>
          </div>
        ) : (
          <>
            <p className="reset-desc">Digite sua nova senha.</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>Nova senha</label>
                <div className="auth-password-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button type="button" className="auth-pass-toggle"
                    onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? 'Ocultar' : 'Mostrar'}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label>Confirmar senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
