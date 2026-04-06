import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MUSIC_STYLES = [
  { id: 'funk',      label: 'Funk',       emoji: '🎤', bg: '#1a0a0a' },
  { id: 'eletronico',label: 'Eletrônico', emoji: '🎧', bg: '#0a0a1a' },
  { id: 'pagode',    label: 'Pagode',     emoji: '🥁', bg: '#0a1a0a' },
  { id: 'sertanejo', label: 'Sertanejo',  emoji: '🤠', bg: '#1a1a0a' },
  { id: 'rock',      label: 'Rock',       emoji: '🎸', bg: '#1a0a1a' },
  { id: 'mpb',       label: 'MPB',        emoji: '🎵', bg: '#0a1a1a' },
  { id: 'reggae',    label: 'Reggae',     emoji: '🌿', bg: '#0a1a0a' },
  { id: 'pop',       label: 'Pop',        emoji: '⭐', bg: '#1a1a0a' },
];

const VIBES = [
  { id: 'litrão',        label: 'Litrão',          emoji: '🍺', bg: '#1a0e00' },
  { id: 'universitário', label: 'Universitário',   emoji: '🎓', bg: '#00101a' },
  { id: 'rooftop',       label: 'Rooftop',          emoji: '🌆', bg: '#0a0a1a' },
  { id: 'happy-hour',    label: 'Happy Hour',       emoji: '🥂', bg: '#1a1a00' },
  { id: 'pet-friendly',  label: 'Pet Friendly',     emoji: '🐾', bg: '#0a1a0a' },
  { id: 'tv-esportes',   label: 'TV c/ Esportes',  emoji: '⚽', bg: '#001a0a' },
  { id: 'chopp',         label: 'Chopp Artesanal',  emoji: '🍻', bg: '#1a0a00' },
  { id: 'comer-beber',   label: 'Comer e Beber',    emoji: '🍔', bg: '#1a0a0a' },
];

// Usado como standalone page (rota /onboarding) — disparado no 1º login
export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = música, 1 = vibe
  const [selectedMusic, setSelectedMusic] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function finish(skipped = false) {
    setSaving(true);
    try {
      const body = skipped ? {} : {
        pref_music: JSON.stringify(selectedMusic),
        pref_vibes: JSON.stringify(selectedVibes),
      };
      await api.post('/auth/me/onboarding', body);
      await refreshUser();
    } catch {
      // se falhar, ainda deixa entrar — onboarding pode ser refeito
    } finally {
      setSaving(false);
      navigate('/', { replace: true });
    }
  }

  async function next() {
    if (step === 0) {
      setStep(1);
    } else {
      await finish(false);
    }
  }

  const isStep0 = step === 0;
  const items = isStep0 ? MUSIC_STYLES : VIBES;
  const selected = isStep0 ? selectedMusic : selectedVibes;
  const setSelected = isStep0 ? setSelectedMusic : setSelectedVibes;

  return (
    <div className="onboard-wrap">
      <div className="onboard-logo">Bora <span>Floripa</span></div>

      <h1 className="onboard-title">
        {isStep0 ? 'Qual seu estilo musical?' : 'Qual sua vibe de rolê?'}
      </h1>
      <p className="onboard-sub">
        {isStep0
          ? 'Escolha os gêneros que você curte. Pode marcar mais de um!'
          : 'Que tipo de rolê combina mais com você?'}
      </p>

      <div className="onboard-grid">
        {items.map(item => (
          <div
            key={item.id}
            className={`onboard-item${selected.includes(item.id) ? ' selected' : ''}`}
            onClick={() => toggle(item.id, selected, setSelected)}
          >
            <div className="onboard-item-img" style={{ background: item.bg }}>
              {item.emoji}
            </div>
            <span className="onboard-item-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="onboard-footer">
        <div className="onboard-progress">
          <div className={`onboard-dot${step === 0 ? ' active' : ''}`} />
          <div className={`onboard-dot${step === 1 ? ' active' : ''}`} />
        </div>
        <button className="btn-primary" onClick={next} disabled={saving}>
          {saving ? 'Salvando...' : step === 0 ? 'Próxima →' : 'Entrar no app 🎉'}
        </button>
        <button className="btn-skip" onClick={() => finish(true)} disabled={saving}>
          Pular
        </button>
      </div>
    </div>
  );
}
