import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { EventOut, VenueOut } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
const EventDetail = lazy(() => import('../components/EventDetail'));
import { useBora } from '../hooks/useBora';
import { useFollowVenue } from '../hooks/useFollowVenue';
import { usePushNotifications } from '../hooks/usePushNotifications';

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

const MUSIC_LABELS: Record<string, string> = Object.fromEntries(MUSIC_STYLES.map(m => [m.id, m.label]));
const VIBE_LABELS: Record<string, string>  = Object.fromEntries(VIBES.map(v => [v.id, v.label]));

export default function Profile() {
  usePageTitle('Meu Perfil');
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventOut | null>(null);
  const [showEditPrefs, setShowEditPrefs] = useState(false);
  const [editMusic, setEditMusic] = useState<string[]>([]);
  const [editVibes, setEditVibes] = useState<string[]>([]);
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editAgeRange, setEditAgeRange] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [followed, setFollowed] = useState<VenueOut[]>([]);
  const [followedFeed, setFollowedFeed] = useState<EventOut[]>([]);
  const { toggle: toggleFollow } = useFollowVenue(!!user);
  const push = usePushNotifications(!!user);

  const eventIds = [...saved.map(e => e.id), ...followedFeed.map(e => e.id)];
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
    api.get('/follows/venues/feed')
      .then(r => setFollowedFeed(r.data))
      .catch(() => setFollowedFeed([]));
  }, [user, navigate]);

  if (!user) return null;

  const prefMusic: string[] = (() => { try { return JSON.parse(user.pref_music || '[]'); } catch { return []; } })();
  const prefVibes: string[] = (() => { try { return JSON.parse(user.pref_vibes || '[]'); } catch { return []; } })();

  function handleLogout() {
    logout();
    navigate('/');
  }

  function openEditPrefs() {
    setEditMusic(prefMusic);
    setEditVibes(prefVibes);
    setEditNeighborhood(user?.neighborhood || '');
    setEditAgeRange(user?.age_range || '');
    setShowEditPrefs(true);
  }

  function toggleChip(id: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      await api.patch('/auth/me/profile', {
        pref_music: JSON.stringify(editMusic),
        pref_vibes: JSON.stringify(editVibes),
        neighborhood: editNeighborhood || null,
        age_range: editAgeRange || null,
      });
      await refreshUser();
      setShowEditPrefs(false);
    } catch {
      // silently ignore
    } finally {
      setSavingPrefs(false);
    }
  }

  function handleUnsave(eventId: number) {
    api.delete(`/saved/${eventId}`).catch(() => {});
    setSaved(prev => prev.filter(e => e.id !== eventId));
    if (selected?.id === eventId) setSelected(null);
  }

  return (
    <div className="profile-page">
      {/* Avatar + nome */}
      <div className="profile-header">
        <div className="profile-avatar">{(user.display_name || user.name)[0].toUpperCase()}</div>
        <div className="profile-info">
          <div className="profile-name">{user.display_name || user.name}</div>
          <div className="profile-email">{user.email}</div>
          <div className="profile-meta-row">
            {user.neighborhood && <span className="profile-meta-chip">📍 {user.neighborhood}</span>}
            {user.age_range && <span className="profile-meta-chip">{user.age_range} anos</span>}
          </div>
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
            <div className="prefs-modal-title">Editar perfil</div>

            <div className="prefs-modal-section">Bairro que você frequenta</div>
            <select
              className="auth-select prefs-select"
              value={editNeighborhood}
              onChange={e => setEditNeighborhood(e.target.value)}
            >
              <option value="">Nenhum</option>
              {['Centro','Trindade','Lagoa da Conceição','Campeche','Ingleses','Jurerê','Barra da Lagoa','Canasvieiras','Florianópolis (outro bairro)'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <div className="prefs-modal-section">Faixa etária</div>
            <div className="auth-age-row">
              {['18-24','25-34','35-44','45+'].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`auth-age-btn${editAgeRange === r ? ' selected' : ''}`}
                  onClick={() => setEditAgeRange(prev => prev === r ? '' : r)}
                >
                  {r}
                </button>
              ))}
            </div>

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

      {/* Locais seguidos + push */}
      {followed.length > 0 && (
        <>
          <div className="profile-section-header profile-section-title-mt">
            <div className="profile-section-title">
              Locais que você segue <span className="profile-count">{followed.length}</span>
            </div>
            {push.supported && push.permission !== 'denied' && (
              <button
                className={`push-toggle-btn${push.subscribed ? ' active' : ''}`}
                onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                disabled={push.loading}
                title={push.subscribed ? 'Desativar notificações' : 'Ativar notificações de novos eventos'}
              >
                {push.loading ? '...' : push.subscribed ? '🔔 Ativo' : '🔔 Ativar'}
              </button>
            )}
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

          {followedFeed.length > 0 && (
            <>
              <div className="profile-section-title profile-section-title-mt">
                Próximos eventos dos seus favoritos
                <span className="profile-count">{followedFeed.length}</span>
              </div>
              <div className="events-list">
                {followedFeed.slice(0, 6).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelected(event)}
                    boraCount={boraCounts[event.id]?.count || 0}
                    boraReacted={boraCounts[event.id]?.reacted || false}
                    onBora={toggleBora}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="profile-actions">
        <button className="btn-danger profile-logout" onClick={handleLogout}>
          Sair da conta
        </button>
      </div>

      {selected && (
        <Suspense fallback={null}>
          <EventDetail
            event={selected}
            onClose={() => setSelected(null)}
            boraCount={boraCounts[selected.id]?.count || 0}
            boraReacted={boraCounts[selected.id]?.reacted || false}
            onBora={toggleBora}
          />
        </Suspense>
      )}
    </div>
  );
}
