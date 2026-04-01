import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import { useBora } from '../hooks/useBora';
import { useFollowVenue } from '../hooks/useFollowVenue';

const MUSIC_LABELS = {
  funk: 'Funk', eletronico: 'Eletrônico', pagode: 'Pagode',
  sertanejo: 'Sertanejo', rock: 'Rock', mpb: 'MPB', reggae: 'Reggae', pop: 'Pop',
};
const VIBE_LABELS = {
  rooftop: 'Rooftop', 'pet-friendly': 'Pet Friendly', 'happy-hour': 'Happy Hour',
  chopp: 'Chopp Artesanal', 'comer-beber': 'Comer e Beber', 'tv-esportes': 'TV c/ Esportes',
  litrão: 'Litrão', universitário: 'Universitário',
};

export default function Profile() {
  usePageTitle('Meu Perfil');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
      {(prefMusic.length > 0 || prefVibes.length > 0) && (
        <div className="profile-prefs">
          <div className="profile-section-title">Suas preferências</div>
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
