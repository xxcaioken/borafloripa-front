import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconMapPin, IconBrandInstagram, IconBrandWhatsapp, IconNavigation,
  IconFlame, IconCheck, IconBell, IconBellRinging, IconAccessible,
  IconEar, IconEye, IconParking, IconPaw, IconStar,
} from '@tabler/icons-react';
import { api } from '../services/api';
import type { VenueOut, EventOut } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import EventCard from '../components/EventCard';
import { useBora } from '../hooks/useBora';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../hooks/useSaved';
import { useSessionId } from '../hooks/useSessionId';
import { useToast } from '../context/ToastContext';
import { useFollowVenue } from '../hooks/useFollowVenue';

interface VibeTag {
  tag_name: string;
  count: number;
  voted: boolean;
}

interface ReviewOut {
  id: number;
  rating: number;
  text: string | null;
  created_at: string;
  user_name: string;
}

const VENUE_BG = [
  'radial-gradient(circle at 30% 30%, #0d2e1a 0%, #061008 100%)',
  'radial-gradient(circle at 70% 30%, #13082e 0%, #070410 100%)',
  'radial-gradient(circle at 30% 70%, #082e24 0%, #040f0c 100%)',
  'radial-gradient(circle at 60% 60%, #1a2208 0%, #0a100a 100%)',
  'radial-gradient(circle at 50% 20%, #2e1408 0%, #100804 100%)',
  'radial-gradient(circle at 20% 80%, #081a2e 0%, #040810 100%)',
];
const VENUE_EMOJIS = ['🍸', '🎵', '🏖️', '🌆', '🎉', '🍻']; // decorativo — mantém emojis culturais
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
  const { followedIds, toggle: toggleFollow } = useFollowVenue(!!user);

  const [venue, setVenue] = useState<VenueOut | null>(null);
  const [events, setEvents] = useState<EventOut[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [allVibeTags, setAllVibeTags] = useState<string[]>([]);
  const [showVibeAll, setShowVibeAll] = useState(false);
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; avg: number | null } | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  usePageTitle(venue ? venue.name : null);

  useEffect(() => {
    api.get(`/events/venues/${id}`)
      .then(r => setVenue(r.data))
      .catch(() => setNotFound(true));
    api.get('/events/feed', { params: { venue_id: id, limit: 10 } })
      .then(r => setEvents(r.data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/vibes/venue/${id}?session_id=${sessionId}`).then(r => setVibeTags(r.data)).catch(() => {});
    api.get('/vibes/tags').then(r => setAllVibeTags(r.data)).catch(() => {});
    api.get(`/reviews/venues/${id}`).then(r => setReviews(r.data)).catch(() => {});
    api.get(`/reviews/venues/${id}/summary`).then(r => setReviewSummary(r.data)).catch(() => {});
  }, [id, sessionId]);

  async function handleReviewSubmit() {
    if (!user) { navigate('/perfil'); return; }
    if (!myRating) return;
    setReviewSubmitting(true);
    try {
      const { data } = await api.post(`/reviews/venues/${id}`, { rating: myRating, text: myText.trim() || null });
      setReviews(prev => {
        const existing = prev.findIndex(r => r.user_name === user.name.split(' ')[0]);
        if (existing >= 0) { const copy = [...prev]; copy[existing] = data; return copy; }
        return [data, ...prev];
      });
      setReviewSummary(prev => prev ? { count: prev.count + 1, avg: prev.avg } : { count: 1, avg: myRating });
      setShowReviewForm(false);
      toast?.show('Avaliação enviada! ⭐', 'success');
    } catch {
      toast?.show('Erro ao enviar avaliação', 'info');
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleVibeVote(tagName: string) {
    if (!id) return;
    const res = await api.post(`/vibes/venue/${id}/${encodeURIComponent(tagName)}?session_id=${sessionId}`);
    const voted = res.data.voted as boolean;
    setVibeTags(prev => {
      const existing = prev.find(t => t.tag_name === tagName);
      if (existing) {
        return prev.map(t => t.tag_name === tagName
          ? { ...t, count: t.count + (voted ? 1 : -1), voted }
          : t
        ).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
      }
      return [...prev, { tag_name: tagName, count: 1, voted: true }].sort((a, b) => b.count - a.count);
    });
  }

  async function handleFollow() {
    if (!user) { navigate('/perfil'); return; }
    const wasFollowing = followedIds.has(Number(id));
    await toggleFollow(Number(id));
    toast?.show(wasFollowing ? `Deixou de seguir ${venue?.name}` : `Seguindo ${venue?.name}! 🔔`, wasFollowing ? 'info' : 'success');
  }

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
    { key: 'pet_friendly' as AccessKey, label: 'Pet Friendly',   icon: <IconPaw size={14} /> },
    { key: 'wheelchair' as AccessKey,   label: 'Cadeirantes',    icon: <IconAccessible size={14} /> },
    { key: 'hearing_loop' as AccessKey, label: 'Loop auditivo',  icon: <IconEar size={14} /> },
    { key: 'visual_aid' as AccessKey,   label: 'Aux. visual',    icon: <IconEye size={14} /> },
    { key: 'adapted_wc' as AccessKey,   label: 'WC adaptado',    icon: '🚻' },
    { key: 'parking' as AccessKey,      label: 'Vaga especial',  icon: <IconParking size={14} /> },
  ].filter(a => venue[a.key]);

  return (
    <div className="venue-detail">
      {/* Hero */}
      <div
        className="vd-hero"
        style={venue.photo_url
          ? { backgroundImage: `url(${venue.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: VENUE_BG[bgIdx] }}
      >
        <button className="vd-back" onClick={() => navigate(-1)} aria-label="Voltar">←</button>
        {!venue.photo_url && <div className="vd-hero-emoji">{emoji}</div>}
        {isHot && <div className="vd-hot-badge"><IconFlame size={14} /> Hot Zone</div>}
      </div>

      <div className="vd-body">
        {/* Título e categoria */}
        <div className="vd-title-row">
          <h1 className="vd-name">{venue.name}</h1>
          {venue.category && (
            <span className="vd-cat-badge">{CATEGORY_LABEL[venue.category] || venue.category}</span>
          )}
        </div>

        {/* Check-in + Follow */}
        <div className="checkin-zone">
          <div className="checkin-info">
            <div className="checkin-count">{venue.checkin_count || 0}</div>
            <div className="checkin-label">
              {(venue.checkin_count || 0) === 1 ? 'pessoa aqui agora' : 'pessoas aqui agora'}
            </div>
          </div>
          <div className="vd-action-btns">
            <button
              className="btn-checkin"
              onClick={handleCheckin}
              disabled={checkinDone}
            >
              {checkinDone ? <><IconCheck size={14} /> Check-in feito</> : <><IconMapPin size={14} /> Estou aqui!</>}
            </button>
            <button
              className={`vd-follow-btn${followedIds.has(venue.id) ? ' following' : ''}`}
              onClick={handleFollow}
              aria-pressed={followedIds.has(venue.id)}
            >
              {followedIds.has(venue.id)
                ? <><IconBellRinging size={14} /> Seguindo</>
                : <><IconBell size={14} /> Seguir</>}
            </button>
          </div>
        </div>

        {/* Vibe pulse */}
        {(vibeTags.length > 0 || showVibeAll) && (
          <div className="vd-section vibe-vote-area">
            <div className="vd-section-title">A galera diz que é...</div>
            <div className="vibe-chips">
              {vibeTags.slice(0, showVibeAll ? undefined : 5).map(t => (
                <button
                  key={t.tag_name}
                  className={`vibe-chip${t.voted ? ' voted' : ''}`}
                  onClick={() => handleVibeVote(t.tag_name)}
                >
                  {t.tag_name} <span className="vibe-chip-count">{t.count}</span>
                </button>
              ))}
              {!showVibeAll && allVibeTags.filter(tag => !vibeTags.find(t => t.tag_name === tag)).slice(0, 3).map(tag => (
                <button
                  key={tag}
                  className="vibe-chip add"
                  onClick={() => handleVibeVote(tag)}
                >
                  + {tag}
                </button>
              ))}
            </div>
            {!showVibeAll && (allVibeTags.length > 5) && (
              <button className="vibe-show-more" onClick={() => setShowVibeAll(true)}>
                Ver todos os vibes
              </button>
            )}
          </div>
        )}
        {vibeTags.length === 0 && !showVibeAll && allVibeTags.length > 0 && (
          <div className="vd-section vibe-vote-area">
            <div className="vd-section-title">Como é esse lugar?</div>
            <div className="vibe-chips">
              {allVibeTags.slice(0, 4).map(tag => (
                <button
                  key={tag}
                  className="vibe-chip add"
                  onClick={() => handleVibeVote(tag)}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Endereço + Como chegar */}
        {venue.address && (
          <div className="vd-address-row">
            <span className="vd-address"><IconMapPin size={14} /> {venue.address}</span>
            <button
              className="vd-maps-btn"
              onClick={() => openMaps(venue.lat, venue.lng, venue.name)}
            >
              <IconNavigation size={14} /> Como chegar
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
                <IconBrandInstagram size={14} /> {venue.instagram.startsWith('@') ? venue.instagram : `@${venue.instagram}`}
              </a>
            )}
            {venue.whatsapp && (
              <a
                className="vd-contact-chip vd-whatsapp"
                href={`https://wa.me/${venue.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandWhatsapp size={14} /> WhatsApp
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

        {/* Avaliações */}
        <div className="vd-section">
          <div className="vd-section-title-row">
            <div className="vd-section-title">
              Avaliações
              {reviewSummary && reviewSummary.count > 0 && (
                <span className="review-avg"><IconStar size={13} /> {reviewSummary.avg?.toFixed(1)} <span className="review-count">({reviewSummary.count})</span></span>
              )}
            </div>
            {user && !showReviewForm && (
              <button className="vd-review-open-btn" onClick={() => setShowReviewForm(true)}>
                + Avaliar
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="review-form">
              <div className="review-stars">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    className={`review-star${s <= myRating ? ' active' : ''}`}
                    onClick={() => setMyRating(s)}
                    aria-label={`${s} estrela${s > 1 ? 's' : ''}`}
                  >★</button>
                ))}
              </div>
              <textarea
                className="review-textarea"
                placeholder="O que achou? (opcional, máx. 280 chars)"
                maxLength={280}
                value={myText}
                onChange={e => setMyText(e.target.value)}
                rows={3}
              />
              <div className="review-form-actions">
                <button className="btn-ghost" onClick={() => setShowReviewForm(false)}>Cancelar</button>
                <button
                  className="btn-primary"
                  onClick={handleReviewSubmit}
                  disabled={!myRating || reviewSubmitting}
                >
                  {reviewSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}

          {reviews.length === 0 && !showReviewForm ? (
            <p className="vd-events-empty" style={{ fontSize: '13px' }}>
              Nenhuma avaliação ainda. Seja o primeiro! 🌟
            </p>
          ) : (
            <div className="reviews-list">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="review-item">
                  <div className="review-item-header">
                    <span className="review-item-name">{r.user_name}</span>
                    <span className="review-item-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.text && <p className="review-item-text">{r.text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

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
