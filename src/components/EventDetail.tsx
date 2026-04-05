import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { EventOut } from '../services/api';
import { useSessionId } from '../hooks/useSessionId';
import { useToast } from '../context/ToastContext';

const COVERS = [
  'linear-gradient(135deg, #1a0a2e 0%, #2e0a1a 100%)',
  'linear-gradient(135deg, #0a1a2e 0%, #1a2e0a 100%)',
  'linear-gradient(135deg, #2e0a1a 0%, #0a1a2e 100%)',
  'linear-gradient(135deg, #1a2e0a 0%, #2e1a0a 100%)',
  'linear-gradient(135deg, #2e1a0a 0%, #0a2e2a 100%)',
];

const TAG_ICONS: Record<string, string> = {
  'Eletrônico': '🎧', 'Funk': '🎤', 'Pagode': '🥁', 'MPB': '🎵',
  'Reggae': '🌿', 'Sertanejo': '🤠', 'Rock': '🎸', 'Rooftop': '🌆',
  'Pet Friendly': '🐾', 'Instagramável': '📸', 'Dance Floor': '💃',
  'Música ao Vivo': '🎙️', 'Happy Hour': '🥂', 'Chopp Artesanal': '🍻',
  'Comer e Beber': '🍔', 'TV com Esportes': '⚽',
};

interface VibeTag {
  tag_name: string;
  count: number;
  voted: boolean;
}

interface EventStats {
  view_count: number;
  bora_count: number;
  checkin_count: number;
}

interface EventDetailProps {
  event: EventOut;
  onClose: () => void;
  boraCount?: number;
  boraReacted?: boolean;
  onBora?: (id: number) => void;
}

function parseHours(hoursJson: string | null | undefined): Record<string, string> | null {
  if (!hoursJson) return null;
  try { return JSON.parse(hoursJson) as Record<string, string>; } catch { return null; }
}

function getTodayKey() {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date().getDay()];
}

export default function EventDetail({ event, onClose, boraCount = 0, boraReacted = false, onBora }: EventDetailProps) {
  const gradient = COVERS[event.id % COVERS.length];
  const date = new Date(event.date);
  const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hours = parseHours(event.venue.hours);
  const today = getTodayKey();
  const sessionId = useSessionId();
  const toast = useToast();

  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [allVibeTags, setAllVibeTags] = useState<string[]>([]);
  const [showVibeAll, setShowVibeAll] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [stats, setStats] = useState<EventStats | null>(null);
  const DESC_LIMIT = 150;

  useEffect(() => {
    api.get(`/vibes/venue/${event.venue.id}?session_id=${sessionId}`).then(r => setVibeTags(r.data)).catch(() => {});
    api.get('/vibes/tags').then(r => setAllVibeTags(r.data)).catch(() => {});
    api.get(`/events/${event.id}/stats`).then(r => setStats(r.data)).catch(() => {});
  }, [event.id, event.venue.id, sessionId]);

  async function handleVibeVote(tagName: string) {
    const res = await api.post(`/vibes/venue/${event.venue.id}/${encodeURIComponent(tagName)}?session_id=${sessionId}`);
    const voted = res.data.voted;
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

  function handleShare() {
    const url = `${window.location.origin}/evento/${event.id}`;
    const dateLabel = new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const text = `${event.title} em ${event.venue.name} — ${dateLabel}${event.price_info ? ` (${event.price_info})` : ''}`;
    if (navigator.share) {
      navigator.share({ title: event.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => toast?.show('Link copiado! 📋', 'success'));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-cover" style={event.cover_url ? {} : { background: gradient }}>
          {event.cover_url && (
            <img className="modal-cover-img" src={event.cover_url} alt={event.title} loading="lazy" />
          )}
          <div className="modal-cover-gradient" />
        </div>

        <div className="modal-body">
          <div className="modal-title">{event.title}</div>
          <div className="modal-venue-name">
            {event.venue.name}
            {hours && hours[today] && hours[today] !== 'Fechado' && (
              <span className="opens-today">Abre hoje</span>
            )}
          </div>
          <div className="modal-date">📅 {dateStr} às {timeStr}</div>

          {stats && (
            <div className="modal-stats-row">
              <div className="modal-stat"><span className="modal-stat-n">{stats.view_count}</span><span>views</span></div>
              <div className="modal-stat-sep" />
              <div className="modal-stat"><span className="modal-stat-n">{stats.bora_count}</span><span>boras</span></div>
              {stats.checkin_count > 0 && (
                <>
                  <div className="modal-stat-sep" />
                  <div className="modal-stat modal-stat-hot">
                    <span className="modal-stat-n">{stats.checkin_count}</span><span>aqui agora</span>
                  </div>
                </>
              )}
            </div>
          )}

          {event.description && (
            <div className="modal-desc">
              {!descExpanded && event.description.length > DESC_LIMIT
                ? <>{event.description.slice(0, DESC_LIMIT)}…</>
                : event.description}
              {event.description.length > DESC_LIMIT && (
                <button
                  className="desc-expand-btn"
                  onClick={() => setDescExpanded(v => !v)}
                >
                  {descExpanded ? ' Ver menos' : ' Ver mais'}
                </button>
              )}
            </div>
          )}

          {/* Para você curtir */}
          {event.tags.length > 0 && (
            <>
              <div className="modal-section-title">Para você curtir</div>
              <div className="curtir-badges curtir-badges-flush">
                {event.tags.map(tag => (
                  <div key={tag.id} className="curtir-badge">
                    <div className="cb-icon">{TAG_ICONS[tag.name] || '🎭'}</div>
                    <span>{tag.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* A galera diz que é... */}
          <div className="modal-section-title">A galera diz que é...</div>
          <div className="vibe-vote-area">
            {vibeTags.map(t => (
              <button
                key={t.tag_name}
                className={`vibe-chip${t.voted ? ' voted' : ''}`}
                onClick={() => handleVibeVote(t.tag_name)}
              >
                {t.tag_name} <span className="vibe-count">{t.count}</span>
              </button>
            ))}
            {showVibeAll
              ? allVibeTags
                  .filter(tag => !vibeTags.find(t => t.tag_name === tag))
                  .map(tag => (
                    <button key={tag} className="vibe-chip add" onClick={() => handleVibeVote(tag)}>
                      + {tag}
                    </button>
                  ))
              : (
                <button className="vibe-chip add" onClick={() => setShowVibeAll(true)}>
                  + Adicionar
                </button>
              )
            }
          </div>

          {/* Preço */}
          {event.price_info && (
            <div className="venue-info-row venue-info-row-mb">
              <div className="venue-info-icon">💰</div>
              <div className="venue-info-text">
                <strong>Entrada</strong>
                {event.price_info}
              </div>
            </div>
          )}

          {/* Acessibilidade */}
          {(event.venue.wheelchair || event.venue.hearing_loop || event.venue.visual_aid || event.venue.adapted_wc) && (
            <>
              <div className="modal-section-title">Acessibilidade</div>
              <div className="modal-a11y-row">
                {event.venue.wheelchair && <div className="modal-a11y-pill">♿ Rampa/Elevador</div>}
                {event.venue.hearing_loop && <div className="modal-a11y-pill">🦻 Loop magnético</div>}
                {event.venue.visual_aid && <div className="modal-a11y-pill">👁️ Auxílio visual</div>}
                {event.venue.adapted_wc && <div className="modal-a11y-pill">🚻 WC adaptado</div>}
              </div>
            </>
          )}

          {/* Informações do venue */}
          <div className="modal-section-title">Informações</div>

          {event.venue.address && (
            <div className="venue-info-row">
              <div className="venue-info-icon">📍</div>
              <div className="venue-info-text">
                <strong>Endereço</strong>
                {event.venue.address}
              </div>
            </div>
          )}
          {event.venue.instagram && (
            <div className="venue-info-row">
              <div className="venue-info-icon">📸</div>
              <div className="venue-info-text">
                <strong>Instagram</strong>
                {event.venue.instagram}
              </div>
            </div>
          )}
          {event.venue.whatsapp && (
            <div className="venue-info-row">
              <div className="venue-info-icon">💬</div>
              <div className="venue-info-text">
                <strong>WhatsApp</strong>
                +55 {event.venue.whatsapp}
              </div>
            </div>
          )}

          {/* Horários */}
          {hours && (
            <>
              <div className="modal-section-title modal-section-title-mt">Horários</div>
              <div className="hours-grid">
                {Object.entries(hours).map(([day, time]) => (
                  <div key={day} className="hour-row">
                    <span className="hour-day">{day}</span>
                    <span className={`hour-time${time === 'Fechado' ? ' closed' : day === today ? ' open-now' : ''}`}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Bora! */}
          <div className="bora-row modal-bora">
            <button
              className={`bora-btn large${boraReacted ? ' reacted' : ''}`}
              onClick={() => onBora && onBora(event.id)}
            >
              {boraReacted ? '✓ Tô dentro!' : '🚀 Bora lá!'}
            </button>
            {boraCount > 0 && (
              <span className="bora-count">
                {boraCount} {boraCount === 1 ? 'pessoa vai' : 'pessoas vão'}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                const { lat, lng, name } = event.venue;
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const url = isIOS
                  ? `maps://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                window.open(url, '_blank');
              }}
            >
              🗺️ Como chegar
            </button>
            <button className="btn-secondary" onClick={handleShare} title="Compartilhar">
              📤
            </button>
            {event.venue.whatsapp && (
              <button
                className="btn-secondary"
                onClick={() => window.open(`https://wa.me/55${event.venue.whatsapp}`, '_blank')}
              >
                💬
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
