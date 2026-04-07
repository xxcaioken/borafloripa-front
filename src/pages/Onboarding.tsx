import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MUSIC_STYLES = [
  { id: 'funk',       label: 'Funk',       emoji: '🎤', bg: '#1a0a0a' },
  { id: 'eletronico', label: 'Eletrônico', emoji: '🎧', bg: '#0a0a1a' },
  { id: 'pagode',     label: 'Pagode',     emoji: '🥁', bg: '#0a1a0a' },
  { id: 'sertanejo',  label: 'Sertanejo',  emoji: '🤠', bg: '#1a1a0a' },
  { id: 'rock',       label: 'Rock',       emoji: '🎸', bg: '#1a0a1a' },
  { id: 'mpb',        label: 'MPB',        emoji: '🎵', bg: '#0a1a1a' },
  { id: 'reggae',     label: 'Reggae',     emoji: '🌿', bg: '#0a1a0a' },
  { id: 'pop',        label: 'Pop',        emoji: '⭐', bg: '#1a1a0a' },
];

const VIBES = [
  { id: 'litrão',        label: 'Litrão',         emoji: '🍺', bg: '#1a0e00' },
  { id: 'universitário', label: 'Universitário',  emoji: '🎓', bg: '#00101a' },
  { id: 'rooftop',       label: 'Rooftop',         emoji: '🌆', bg: '#0a0a1a' },
  { id: 'happy-hour',    label: 'Happy Hour',      emoji: '🥂', bg: '#1a1a00' },
  { id: 'pet-friendly',  label: 'Pet Friendly',    emoji: '🐾', bg: '#0a1a0a' },
  { id: 'tv-esportes',   label: 'TV c/ Esportes', emoji: '⚽', bg: '#001a0a' },
  { id: 'chopp',         label: 'Chopp Artesanal', emoji: '🍻', bg: '#1a0a00' },
  { id: 'comer-beber',   label: 'Comer e Beber',   emoji: '🍔', bg: '#1a0a0a' },
];

const NEIGHBORHOODS = [
  'Centro', 'Trindade', 'Lagoa da Conceição', 'Campeche',
  'Ingleses', 'Jurerê', 'Barra da Lagoa', 'Canasvieiras',
  'Florianópolis (outro bairro)',
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45+'];

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [neighborhood, setNeighborhood] = useState('');
  const [ageRange, setAgeRange] = useState('');
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
        neighborhood: neighborhood || null,
        age_range: ageRange || null,
      };
      await api.post('/auth/me/onboarding', body);
      await refreshUser();
    } catch {
      // falha silenciosa — onboarding pode ser refeito depois
    } finally {
      setSaving(false);
      navigate('/', { replace: true });
    }
  }

  async function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      await finish(false);
    }
  }

  const titles = [
    'Qual seu estilo musical?',
    'Qual sua vibe de rolê?',
    'Onde você costuma sair?',
  ];
  const subs = [
    'Escolha os gêneros que você curte. Pode marcar mais de um!',
    'Que tipo de rolê combina mais com você?',
    'Assim personalizamos seu feed de Floripa.',
  ];

  return (
    <div className="onboard-wrap">
      <div className="onboard-logo">Bora <span>Floripa</span></div>

      <h1 className="onboard-title">{titles[step]}</h1>
      <p className="onboard-sub">{subs[step]}</p>

      {step === 0 && (
        <div className="onboard-grid">
          {MUSIC_STYLES.map(item => (
            <div
              key={item.id}
              className={`onboard-item${selectedMusic.includes(item.id) ? ' selected' : ''}`}
              onClick={() => toggle(item.id, selectedMusic, setSelectedMusic)}
            >
              <div className="onboard-item-img" style={{ background: item.bg }}>{item.emoji}</div>
              <span className="onboard-item-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="onboard-grid">
          {VIBES.map(item => (
            <div
              key={item.id}
              className={`onboard-item${selectedVibes.includes(item.id) ? ' selected' : ''}`}
              onClick={() => toggle(item.id, selectedVibes, setSelectedVibes)}
            >
              <div className="onboard-item-img" style={{ background: item.bg }}>{item.emoji}</div>
              <span className="onboard-item-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="onboard-location">
          <div className="onboard-field">
            <label className="onboard-field-label">Bairro que você frequenta</label>
            <select
              className="onboard-select"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
            >
              <option value="">Selecionar (opcional)</option>
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="onboard-field">
            <label className="onboard-field-label">Faixa etária</label>
            <div className="onboard-age-row">
              {AGE_RANGES.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`onboard-age-btn${ageRange === r ? ' selected' : ''}`}
                  onClick={() => setAgeRange(prev => prev === r ? '' : r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="onboard-footer">
        <div className="onboard-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`onboard-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>
        <button className="btn-primary" onClick={next} disabled={saving}>
          {saving ? 'Salvando...' : step < TOTAL_STEPS - 1 ? 'Próxima →' : 'Entrar no app 🎉'}
        </button>
        <button className="btn-skip" onClick={() => finish(true)} disabled={saving}>
          Pular
        </button>
      </div>
    </div>
  );
}
