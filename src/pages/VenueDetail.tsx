import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { VenueOut, EventOut } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import EventCard from '../components/EventCard';
import { useBora } from '../hooks/useBora';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../hooks/useSaved';
import { useSessionId } from '../hooks/useSessionId';
import { useToast } from '../context/ToastContext';

const VENUE_BG = [
  'radial-gradient(circle at 30% 30%, #0d2e1a 0%, #061008 100%)',
  'radial-gradient(circle at 70% 30%, #13082e 0%, #070410 100%)',
  'radial-gradient(circle at 30% 70%, #082e24 0%, #040f0c 100%)',
  'radial-gradient(circle at 60% 60%, #1a2208 0%, #0a100a 100%)',
  'radial-gradient(circle at 50% 20%, #2e1408 0%, #100804 100%)',
  'radial-gradient(circle at 20% 80%, #081a2e 0%, #040810 100%)',
];
const VENUE_EMOJIS = ['🍸', '🎵', '🏖️', '🌆', '🎉', '🍻'];
const CATEGORY_LABEL: Record<string, string> = {
  bar: 'Bar', balada: 'Balada', cultura: 'Cultura', rua: 'Rolê na Rua', temporario: 'Especial'
};
const DAYS_ORDER = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getTodayKey() {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date().getDay()];
}

function parseHours(hoursJson: string | null | undefined): Record<string, string> | null {
  if (!hoursJson) return null;
  try { return JSON.parse(hoursJson) as Record<string, string>; } catch { return null; }
}

function openMaps(lat: number, lng: number, name: string) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = isIOS
    ? `https://maps.apple.com/?q=${lat},${lng}`
    : `https://www.google.com/maps?q=${lat},${lng}&query=${encodeURIComponent(name)}`;
  window.open(url, '_blank', 'noopener');
}

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedIds, toggle: toggleSaved } = useSaved(!!user);
  const sessionId = useSessionId();
  const toast = useToast();

  const [venue, setVenue] = useState<VenueOut | null>(null);
  const [events, setEvents] = useState<EventOut[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);

  usePageTitle(venue ? venue.name : null);

  useEffect(() => {
    api.get(`/events/venues/${id}`)
      .then(r => setVenue(r.data))
      .catch(() => setNotFound(true));
    api.get('/events/feed', { params: { venue_id: id, limit: 10 } })
      .then(r => setEvents(r.data))
      .catch(() => {});
  }, [id]);

  const eventIds = events.map(e => e.id);
  const { counts: boraCounts, toggle: toggleBora } = useBora(eventIds);

  async function handleCheckin() {
    try {
      const { data } = await api.post('/checkins', { venue_id: Number(id), session_id: sessionId });
      setVenue(prev => prev ? { ...prev, checkin_count: data.checkin_count } : prev);
      setCheckinDone(true);
      toast?.show(`Check-in em ${venue?.name ?? 'local'}! 📍`, 'success');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 429) {
          toast?.show('Você já fez check-in recentemente aqui', 'info');
          setCheckinDone(true);
        }
      }
    }
  }

  if (notFound) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">😕</div>
        <p>Local não encontrado</p>
        <button className="btn-retry" onClick={() => navigate('/')}>Voltar</button>
      </div>
    );
  }

  if (!venue) {
    return <div className="loading loading-page">Carregando...</div>;
  }

  const hours = parseHours(venue.hours);
  const today = getTodayKey();
  const isHot = (venue.checkin_count || 0) >= 5;
  const bgIdx = venue.id % VENUE_BG.length;
  const emoji = VENUE_EMOJIS[venue.id % VENUE_EMOJIS.length];

  type AccessKey = keyof VenueOut;
  const accessItems = [
    { key: 'wheelchair' as AccessKey, label: 'Cadeirantes', icon: '♿' },
    { key: 'hearing_loop' as AccessKey, label: 'Loop auditivo', icon: '🦻' },
    { key: 'visual_aid' as AccessKey, label: 'Aux. visual', icon: '👁' },
    { key: 'adapted_wc' as AccessKey, label: 'WC adaptado', icon: '🚻' },
    { key: 'parking' as AccessKey, label: 'Vaga especial', icon: '🅿️' },
  ].filter(a => venue[a.key]);

  return (
    <div className="venue-detail">
      {/* Hero */}
      <div className="vd-hero" style={{ background: VENUE_BG[bgIdx] }}>
        <button className="vd-back" onClick={() => navigate(-1)} aria-label="Voltar">←</button>
        <div className="vd-hero-emoji">{emoji}</div>
        {isHot && <div className="vd-hot-badge">🔥 Hot Zone</div>}
      </div>

      <div className="vd-body">
        {/* Título e categoria */}
        <div className="vd-title-row">
          <h1 className="vd-name">{venue.name}</h1>
          {venue.category && (
            <span className="vd-cat-badge">{CATEGORY_LABEL[venue.category] || venue.category}</span>
          )}
        </div>

        {/* Check-in */}
        <div className="checkin-zone">
          <div className="checkin-info">
            <div className="checkin-count">{venue.checkin_count || 0}</div>
            <div className="checkin-label">
              {(venue.checkin_count || 0) === 1 ? 'pessoa aqui agora' : 'pessoas aqui agora'}
            </div>
          </div>
          <button
            className="btn-checkin"
            onClick={handleCheckin}
            disabled={checkinDone}
          >
            {checkinDone ? '✓ Check-in feito' : '📍 Estou aqui!'}
          </button>
        </div>

        {/* Endereço + Como chegar */}
        {venue.address && (
          <div className="vd-address-row">
            <span className="vd-address">📍 {venue.address}</span>
            <button
              className="vd-maps-btn"
              onClick={() => openMaps(venue.lat, venue.lng, venue.name)}
            >
              Como chegar
            </button>
          </div>
        )}

        {/* Contatos */}
        {(venue.instagram || venue.whatsapp) && (
          <div className="vd-contacts">
            {venue.instagram && (
              <a
                className="vd-contact-chip vd-instagram"
                href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📸 {venue.instagram.startsWith('@') ? venue.instagram : `@${venue.instagram}`}
              </a>
            )}
            {venue.whatsapp && (
              <a
                className="vd-contact-chip vd-whatsapp"
                href={`https://wa.me/${venue.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Horários */}
        {hours && (
          <div className="vd-section">
            <div className="vd-section-title">Horários</div>
            <div className="vd-hours">
              {DAYS_ORDER.map(day => {
                const val = hours[day];
                if (!val) return null;
                const isToday = day === today;
                return (
                  <div key={day} className={`vd-hours-row${isToday ? ' today' : ''}`}>
                    <span className="vd-hours-day">{day}</span>
                    <span className={`vd-hours-val${val === 'Fechado' ? ' closed' : ''}`}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acessibilidade */}
        {accessItems.length > 0 && (
          <div className="vd-section">
            <div className="vd-section-title">Acessibilidade</div>
            <div className="vd-access-pills">
              {accessItems.map(a => (
                <span key={String(a.key)} className="vd-access-pill">
                  {a.icon} {a.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Eventos */}
        <div className="vd-section">
          <div className="vd-section-title">Eventos</div>
          {events.length === 0 ? (
            <div className="vd-events-empty">
              <p>Nenhum evento programado</p>
            </div>
          ) : (
            <div className="events-list">
              {events.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  boraCount={boraCounts[event.id]?.count || 0}
                  boraReacted={boraCounts[event.id]?.reacted || false}
                  onBora={toggleBora}
                  isSaved={savedIds.has(event.id)}
                  onSave={user ? toggleSaved : null}
                  hero={i === 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
