import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import { useBora } from '../hooks/useBora';
import { useFollowVenue } from '../hooks/useFollowVenue';

const MUSIC_STYLES = [
  { id: 'funk',       label: 'Funk',       emoji: '🎤' },
  { id: 'eletronico', label: 'Eletrônico', emoji: '🎧' },
  { id: 'pagode',     label: 'Pagode',     emoji: '🥁' },
  { id: 'sertanejo',  label: 'Sertanejo',  emoji: '🤠' },
  { id: 'rock',       label: 'Rock',       emoji: '🎸' },
  { id: 'mpb',        label: 'MPB',        emoji: '🎵' },
  { id: 'reggae',     label: 'Reggae',     emoji: '🌿' },
  { id: 'pop',        label: 'Pop',        emoji: '⭐' },
];
const VIBES = [
  { id: 'litrão',        label: 'Litrão',          emoji: '🍺' },
  { id: 'universitário', label: 'Universitário',   emoji: '🎓' },
  { id: 'rooftop',       label: 'Rooftop',         emoji: '🌆' },
  { id: 'happy-hour',    label: 'Happy Hour',      emoji: '🥂' },
  { id: 'pet-friendly',  label: 'Pet Friendly',    emoji: '🐾' },
  { id: 'tv-esportes',   label: 'TV c/ Esportes',  emoji: '⚽' },
  { id: 'chopp',         label: 'Chopp Artesanal', emoji: '🍻' },
  { id: 'comer-beber',   label: 'Comer e Beber',   emoji: '🍔' },
];

const MUSIC_LABELS = Object.fromEntries(MUSIC_STYLES.map(m => [m.id, m.label]));
const VIBE_LABELS  = Object.fromEntries(VIBES.map(v => [v.id, v.label]));

export default function Profile() {
  usePageTitle('Meu Perfil');
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showEditPrefs, setShowEditPrefs] = useState(false);
  const [editMusic, setEditMusic] = useState([]);
  const [editVibes, setEditVibes] = useState([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [followed, setFollowed] = useState([]);
  const { followedIds, toggle: toggleFollow } = useFollowVenue(!!user);

  const eventIds = saved.map(e => e.id);
  const { counts: boraCounts, toggle: toggleBora } = useBora(eventIds);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api.get('/saved')
      .then(r => setSaved(r.data))
      .catch(() => setSaved([]))
      .finally(() => setLoading(false));
    api.get('/follows/venues')
      .then(r => setFollowed(r.data))
      .catch(() => setFollowed([]));
  }, [user]);

  if (!user) return null;

  const prefMusic = (() => { try { return JSON.parse(user.pref_music || '[]'); } catch { return []; } })();
  const prefVibes = (() => { try { return JSON.parse(user.pref_vibes || '[]'); } catch { return []; } })();

  function handleLogout() {
    logout();
    navigate('/');
  }

  function openEditPrefs() {
    setEditMusic(prefMusic);
    setEditVibes(prefVibes);
    setShowEditPrefs(true);
  }

  function toggleChip(id, list, setter) {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      await api.put('/auth/me/preferences', null, {
        params: {
          pref_music: JSON.stringify(editMusic),
          pref_vibes: JSON.stringify(editVibes),
        },
      });
      localStorage.setItem('bf_pref_music', JSON.stringify(editMusic));
      localStorage.setItem('bf_pref_vibes', JSON.stringify(editVibes));
      await refreshUser();
      setShowEditPrefs(false);
    } catch {
      // silently ignore
    } finally {
      setSavingPrefs(false);
    }
  }

  function handleUnsave(eventId) {
    api.delete(`/saved/${eventId}`).catch(() => {});
    setSaved(prev => prev.filter(e => e.id !== eventId));
    if (selected?.id === eventId) setSelected(null);
  }

  return (
    <div className="profile-page">
      {/* Avatar + nome */}
      <div className="profile-header">
        <div className="profile-avatar">{user.name[0].toUpperCase()}</div>
        <div className="profile-info">
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
        </div>
      </div>

      {/* Preferências */}
      <div className="profile-prefs">
        <div className="profile-prefs-header">
          <div className="profile-section-title">Suas preferências</div>
          <button className="prefs-edit-btn" onClick={openEditPrefs}>Editar ✏️</button>
        </div>
        {(prefMusic.length > 0 || prefVibes.length > 0) ? (
          <div className="profile-pref-chips">
            {prefMusic.map(id => (
              <span key={id} className="pref-chip pref-chip-music">
                {MUSIC_LABELS[id] || id}
              </span>
            ))}
            {prefVibes.map(id => (
              <span key={id} className="pref-chip pref-chip-vibe">
                {VIBE_LABELS[id] || id}
              </span>
            ))}
          </div>
        ) : (
          <p className="prefs-empty">Nenhuma preferência definida — o feed mostra tudo</p>
        )}
      </div>

      {/* Modal editar preferências */}
      {showEditPrefs && (
        <div className="prefs-modal-overlay" onClick={() => setShowEditPrefs(false)}>
          <div className="prefs-modal-card" onClick={e => e.stopPropagation()}>
            <div className="prefs-modal-title">Editar preferências</div>
            <div className="prefs-modal-section">Música</div>
            <div className="prefs-chips-grid">
              {MUSIC_STYLES.map(m => (
                <button
                  key={m.id}
                  className={`pref-chip-sel${editMusic.includes(m.id) ? ' selected' : ''}`}
                  onClick={() => toggleChip(m.id, editMusic, setEditMusic)}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            <div className="prefs-modal-section">Vibe</div>
            <div className="prefs-chips-grid">
              {VIBES.map(v => (
                <button
                  key={v.id}
                  className={`pref-chip-sel${editVibes.includes(v.id) ? ' selected' : ''}`}
                  onClick={() => toggleChip(v.id, editVibes, setEditVibes)}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
            <div className="prefs-modal-actions">
              <button className="btn-ghost" onClick={() => setShowEditPrefs(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSavePrefs} disabled={savingPrefs}>
                {savingPrefs ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eventos salvos */}
      <div className="profile-section-title profile-section-title-mt">
        Rolês salvos {!loading && <span className="profile-count">{saved.length}</span>}
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : saved.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum rolê salvo ainda</p>
          <p className="empty-hint">Salve eventos no feed para encontrá-los aqui</p>
        </div>
      ) : (
        <div className="events-list">
          {saved.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelected(event)}
              boraCount={boraCounts[event.id]?.count || 0}
              boraReacted={boraCounts[event.id]?.reacted || false}
              onBora={toggleBora}
              isSaved
              onSave={() => handleUnsave(event.id)}
            />
          ))}
        </div>
      )}

      {/* Locais seguidos */}
      {followed.length > 0 && (
        <>
          <div className="profile-section-title profile-section-title-mt">
            Locais que você segue <span className="profile-count">{followed.length}</span>
          </div>
          <div className="followed-venues-list">
            {followed.map(venue => (
              <div key={venue.id} className="followed-venue-row">
                <span className="followed-venue-name">{venue.name}</span>
                <button
                  className="venue-follow-btn following"
                  onClick={() => {
                    toggleFollow(venue.id);
                    setFollowed(prev => prev.filter(v => v.id !== venue.id));
                  }}
                  aria-label={`Deixar de seguir ${venue.name}`}
                >
                  ✓ Seguindo
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="profile-actions">
        <button className="btn-danger profile-logout" onClick={handleLogout}>
          Sair da conta
        </button>
      </div>

      {selected && (
        <EventDetail
          event={selected}
          onClose={() => setSelected(null)}
          boraCount={boraCounts[selected.id]?.count || 0}
          boraReacted={boraCounts[selected.id]?.reacted || false}
          onBora={toggleBora}
        />
      )}
    </div>
  );
}
