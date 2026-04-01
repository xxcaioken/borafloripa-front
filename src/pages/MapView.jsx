import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { useSessionId } from '../hooks/useSessionId';
import { useToast } from '../context/ToastContext';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;

const FLORIPA = [-27.5954, -48.548];
const CAT_COLOR  = { bar: '#00e676', balada: '#e040fb', cultura: '#ff6d00', rua: '#00bcd4' };
const CAT_EMOJI  = { bar: '🍺', balada: '💃', cultura: '🎭', rua: '🌆' };
const VIBE_COLOR = { 'Quente 🔥': '#ff6d00', 'Lotado': '#ff4081', 'Animado': '#ffeb3b', 'Normal': null };

const FILTERS = [
  { id: 'all',    label: 'Todos',   emoji: '🗺️' },
  { id: 'today',  label: 'Hoje',    emoji: '📅' },
  { id: 'week',   label: 'Semana',  emoji: '🗓️' },
  { id: 'hot',    label: 'Quentes', emoji: '🔥' },
  { id: 'bar',    label: 'Bares',   emoji: '🍺' },
  { id: 'balada', label: 'Baladas', emoji: '💃' },
];

function isToday(iso) {
  const d = new Date(iso), now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}

function makeIcon(venue, isSelected) {
  const hot = venue.checkin_count > 0;
  const hasEvents = venue.events?.length > 0;
  const cat = venue.category || 'bar';
  const color = hot ? '#ff6d00' : (CAT_COLOR[cat] || '#00e676');
  const opacity = hasEvents ? 1 : 0.45;

  const pulse = hot ? `
    <circle cx="23" cy="23" r="21" fill="${color}" opacity="0.18">
      <animate attributeName="r" from="19" to="28" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.25" to="0" dur="1.4s" repeatCount="indefinite"/>
    </circle>` : '';

  const ring = isSelected
    ? `<circle cx="23" cy="23" r="20" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.9"/>` : '';

  const badge = hasEvents
    ? `<circle cx="33" cy="13" r="8" fill="#060908" stroke="${color}" stroke-width="1.5"/>
       <text x="33" y="17" font-size="9" font-weight="700" text-anchor="middle" fill="${color}">${venue.events.length}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46" opacity="${opacity}">
    ${pulse}
    <circle cx="23" cy="23" r="17" fill="${color}" stroke="#060908" stroke-width="2"/>
    ${ring}
    <text x="23" y="28" font-size="15" text-anchor="middle">${CAT_EMOJI[cat] || '📍'}</text>
    ${badge}
  </svg>`;

  return L.divIcon({ html: svg, className: '', iconSize: [46,46], iconAnchor: [23,23], popupAnchor: [0,-26] });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 0.7 });
  }, [target, map]);
  return null;
}

function VenuePopup({ venue, onCheckin }) {
  const todayEvents    = venue.events?.filter(e => isToday(e.date)) || [];
  const upcomingEvents = venue.events?.filter(e => !isToday(e.date)) || [];
  const shortAddr = venue.address
    ? venue.address.replace(', Florianópolis', '').replace(', SC', '') : null;

  return (
    <div className="map-popup">
      <div className="map-popup-name">{venue.name}</div>
      {shortAddr && <div className="map-popup-addr">📍 {shortAddr}</div>}

      {venue.checkin_count > 0 && (
        <div className="map-popup-hot">🔥 {venue.checkin_count} check-ins agora</div>
      )}

      {todayEvents.length > 0 && (
        <div className="map-popup-section">
          <div className="map-popup-section-label map-popup-label-green">Hoje</div>
          {todayEvents.map(e => (
            <div key={e.id} className="map-popup-event">
              <div className="map-popup-event-title">{e.title}</div>
              <div className="map-popup-event-meta">
                {new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                <span style={{ color: VIBE_COLOR[e.vibe_status] || 'var(--text2)' }}>{e.vibe_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="map-popup-section">
          <div className="map-popup-section-label">Próximos ({upcomingEvents.length})</div>
          {upcomingEvents.slice(0, 2).map(e => (
            <div key={e.id} className="map-popup-upcoming">
              {new Date(e.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              {' — '}{e.title}
            </div>
          ))}
          {upcomingEvents.length > 2 && (
            <div className="map-popup-more">+{upcomingEvents.length - 2} eventos</div>
          )}
        </div>
      )}

      {venue.events?.length === 0 && (
        <div className="map-popup-empty">Sem programação esta semana</div>
      )}

      <div className="map-popup-actions">
        <button className="map-popup-checkin" onClick={() => onCheckin(venue)}>
          📍 Check-in
        </button>
        {venue.instagram && (
          <a
            href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
            target="_blank" rel="noreferrer"
            className="map-popup-ig"
          >
            IG
          </a>
        )}
      </div>
    </div>
  );
}

export default function MapView() {
  usePageTitle('Mapa');
  const [venues, setVenues]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [search, setSearch]   = useState('');
  const sessionId = useSessionId();
  const toast = useToast();

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get('/events/map')
      .then(r => setVenues(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCheckin(venue) {
    try {
      const { data } = await api.post('/checkins', { venue_id: venue.id, session_id: sessionId });
      setVenues(prev => prev.map(v =>
        v.id === venue.id ? { ...v, checkin_count: data.checkin_count } : v
      ));
      toast?.show(`Check-in em ${venue.name}! 📍`, 'success');
    } catch (err) {
      if (err.response?.status === 429) {
        toast?.show('Você já fez check-in recentemente aqui', 'info');
      }
    }
  }

  const visible = venues.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'hot')    return v.checkin_count > 0;
    if (filter === 'today')  return v.events?.some(e => isToday(e.date));
    if (filter === 'week')   return v.events?.length > 0;
    if (filter === 'bar')    return v.category === 'bar';
    if (filter === 'balada') return v.category === 'balada';
    return true;
  });

  const hotCount   = venues.filter(v => v.checkin_count > 0).length;
  const todayCount = venues.filter(v => v.events?.some(e => isToday(e.date))).length;
  const weekCount  = venues.filter(v => v.events?.length > 0).length;

  const labelOf = (f) => {
    if (f === 'hot')   return `${hotCount} quentes`;
    if (f === 'today') return `${todayCount} hoje`;
    if (f === 'week')  return `${weekCount} esta semana`;
    return `${visible.length} locais`;
  };

  return (
    <div className="map-page">
      <div className="map-controls">
        <div className="search-bar map-search">
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="search-input"
              placeholder="Buscar local no mapa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar local no mapa"
            />
          </div>
        </div>
        <div className="map-filter-row" role="group" aria-label="Filtros do mapa">
          {FILTERS.map(f => {
            const count = f.id === 'hot' ? hotCount : f.id === 'today' ? todayCount : f.id === 'week' ? weekCount : null;
            if (f.id === 'hot' && hotCount === 0) return null;
            return (
              <button
                key={f.id}
                className={`map-filter-btn${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.emoji} {f.label}{count !== null ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="map-container">
        {loading ? (
          <div className="map-loading">Carregando mapa...</div>
        ) : error ? (
          <div className="map-error">
            <div>😵</div>
            <p>Não foi possível carregar o mapa</p>
            <button className="btn-retry" onClick={load}>Tentar novamente</button>
          </div>
        ) : (
          <MapContainer center={FLORIPA} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />
            <FlyTo target={flyTarget} />
            {visible.map(v => (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={makeIcon(v, selected?.id === v.id)}
                eventHandlers={{ click: () => { setSelected(v); setFlyTarget(v); } }}
              >
                <Popup><VenuePopup venue={v} onCheckin={handleCheckin} /></Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {!loading && !error && (
          <div className="map-stats-badge">📍 {labelOf(filter)}</div>
        )}
      </div>
    </div>
  );
}
