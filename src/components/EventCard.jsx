import React, { memo } from 'react';

const CAT_ACCENT = { bar: '#00e676', balada: '#e040fb', cultura: '#ff6d00', rua: '#00bcd4', temporario: '#ffea00' };

const COVERS = [
  'linear-gradient(135deg, #0d1f14 0%, #1a2e1a 100%)',
  'linear-gradient(135deg, #0a1520 0%, #0f2030 100%)',
  'linear-gradient(135deg, #200a1a 0%, #2e0f1a 100%)',
  'linear-gradient(135deg, #1a1a0a 0%, #2e2a0a 100%)',
  'linear-gradient(135deg, #0a1f1a 0%, #0f2a25 100%)',
];

const TAG_ICONS = {
  'Eletrônico':      { icon: '🎧', label: 'Eletrônico' },
  'Funk':            { icon: '🎤', label: 'Funk' },
  'Pagode':          { icon: '🥁', label: 'Pagode' },
  'MPB':             { icon: '🎵', label: 'MPB' },
  'Reggae':          { icon: '🌿', label: 'Reggae' },
  'Sertanejo':       { icon: '🤠', label: 'Sertanejo' },
  'Rock':            { icon: '🎸', label: 'Rock' },
  'Rooftop':         { icon: '🌆', label: 'Rooftop' },
  'Pet Friendly':    { icon: '🐾', label: 'Pet OK' },
  'Instagramável':   { icon: '📸', label: 'Instagramável' },
  'Dance Floor':     { icon: '💃', label: 'Dance Floor' },
  'Música ao Vivo':  { icon: '🎙️', label: 'Ao Vivo' },
  'Happy Hour':      { icon: '🥂', label: 'Happy Hour' },
  'Chopp Artesanal': { icon: '🍻', label: 'Chopp' },
  'Comer e Beber':   { icon: '🍔', label: 'Comer e Beber' },
  'TV com Esportes': { icon: '⚽', label: 'TV Esportes' },
};

function isOpenToday(hoursJson) {
  if (!hoursJson) return false;
  try {
    const hours = JSON.parse(hoursJson);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = days[new Date().getDay()];
    return hours[today] && hours[today] !== 'Fechado';
  } catch { return false; }
}

function AccessBadges({ venue }) {
  const badges = [];
  if (venue.wheelchair) badges.push({ icon: '♿', label: 'Acessível' });
  if (venue.hearing_loop) badges.push({ icon: '🦻', label: 'Loop magnético' });
  if (venue.visual_aid)  badges.push({ icon: '👁️', label: 'Braille' });
  if (venue.adapted_wc)  badges.push({ icon: '🚻', label: 'WC adaptado' });
  if (!badges.length) return null;
  return (
    <div className="access-badges">
      {badges.map((b, i) => (
        <span key={i} className="access-pill" title={b.label}>{b.icon} {b.label}</span>
      ))}
    </div>
  );
}

const EventCard = memo(function EventCard({ event, onClick, boraCount = 0, boraReacted = false, onBora, isSaved = false, onSave, hero = false }) {
  const isTemp = event.is_temporary;
  const coverBg = isTemp
    ? 'linear-gradient(135deg, #0a2a0f 0%, #142a0a 100%)'
    : COVERS[event.id % COVERS.length];
  const accentColor = isTemp ? CAT_ACCENT.temporario : (CAT_ACCENT[event.category] || CAT_ACCENT.bar);
  const date = new Date(event.date);
  const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const openToday = isOpenToday(event.venue.hours);
  const badges = event.tags.slice(0, 4).map(t => TAG_ICONS[t.name] || { icon: '🎭', label: t.name });
  const checkinCount = event.venue.checkin_count || 0;

  function handleBora(e) {
    e.stopPropagation();
    onBora && onBora(event.id);
  }

  function handleSave(e) {
    e.stopPropagation();
    onSave && onSave(event.id);
  }

  return (
    <div
      className={`event-card${event.is_featured ? ' featured' : ''}${isTemp ? ' temporary' : ''}${hero ? ' hero' : ''}`}
      onClick={onClick}
      role="article"
      aria-label={`${event.title} em ${event.venue.name}`}
      style={{ '--cat-accent': accentColor }}
    >
      {/* Cover */}
      <div
        className="card-cover"
        style={event.cover_url ? undefined : { background: coverBg }}
      >
        {event.cover_url && (
          <img className="card-cover-img" src={event.cover_url} alt={event.title} loading="lazy" />
        )}
        <div className="card-cover-gradient" />

        {/* Top badges */}
        <div className="card-top-badges">
          <div>
            {isTemp && <span className="badge-temporary">⚡ Especial</span>}
            {event.is_featured && !isTemp && <span className="badge-featured">★ Destaque</span>}
          </div>
          <div className="card-top-right">
            {checkinCount > 0 && (
              <div className="checkin-badge">
                <div className={`checkin-dot${checkinCount >= 5 ? ' hot' : ''}`} />
                {checkinCount} aqui
              </div>
            )}
            {onSave && (
              <button
                className={`bookmark-btn${isSaved ? ' saved' : ''}`}
                onClick={handleSave}
                aria-label={isSaved ? 'Remover dos favoritos' : 'Salvar evento'}
              >
                {isSaved ? '🔖' : '🏷️'}
              </button>
            )}
          </div>
        </div>

        {/* Bottom: vibe pill */}
        <div className="card-cover-bottom">
          <span className="card-vibe">{event.vibe_status}</span>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-title">{event.title}</div>
        <div className="card-venue">
          📍 {event.venue.name}
          {openToday && <span className="opens-today">Abre hoje</span>}
        </div>
        <div className="card-date">📅 {dateStr} às {timeStr}</div>

        {event.price_info && (
          <div className="card-price">💰 {event.price_info}</div>
        )}

        {badges.length > 0 && (
          <div className="curtir-badges">
            {badges.map((b, i) => (
              <div key={i} className="curtir-badge">
                <div className="cb-icon">{b.icon}</div>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        )}

        <AccessBadges venue={event.venue} />

        {/* Botão Bora! */}
        <div className="bora-row">
          <button
            className={`bora-btn${boraReacted ? ' reacted' : ''}`}
            onClick={handleBora}
            aria-label={boraReacted ? 'Você confirmou presença' : `Confirmar presença em ${event.title}`}
            aria-pressed={boraReacted}
          >
            {boraReacted ? '✓ Tô dentro!' : '🚀 Bora!'}
          </button>
          {boraCount > 0 && (
            <span className="bora-count">
              {boraCount} {boraCount === 1 ? 'pessoa vai' : 'pessoas vão'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default EventCard;
