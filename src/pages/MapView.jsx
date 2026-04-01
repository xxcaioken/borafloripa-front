import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;

const FLORIPA = [-27.5954, -48.548];
const CAT_COLOR  = { bar: '#00e676', balada: '#e040fb', cultura: '#ff6d00', rua: '#00bcd4' };
const CAT_EMOJI  = { bar: '🍺', balada: '💃', cultura: '🎭', rua: '🌆' };
const VIBE_COLOR = { 'Quente 🔥': '#ff6d00', 'Lotado': '#ff4081', 'Animado': '#ffeb3b', 'Normal': null };

const FILTERS = [
  { id: 'all',    label: 'Todos',      emoji: '🗺️' },
  { id: 'today',  label: 'Hoje',       emoji: '📅' },
  { id: 'week',   label: 'Semana',     emoji: '🗓️' },
  { id: 'hot',    label: 'Quentes',    emoji: '🔥' },
  { id: 'bar',    label: 'Bares',      emoji: '🍺' },
  { id: 'balada', label: 'Baladas',    emoji: '💃' },
];

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}

function makeIcon(venue, isSelected) {
  const hot = venue.checkin_count > 0;
  const hasEvents = venue.events?.length > 0;
  const cat = venue.category || 'bar';
  const color = hot ? '#ff6d00' : (CAT_COLOR[cat] || '#00e676');
  const size = isSelected ? 46 : hasEvents ? 38 : 28;
  const opacity = hasEvents ? 1 : 0.45;

  const pulse = hot ? `
    <circle cx="23" cy="23" r="21" fill="${color}" opacity="0.18">
      <animate attributeName="r" from="19" to="28" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.25" to="0" dur="1.4s" repeatCount="indefinite"/>
    </circle>` : '';

  const ring = isSelected
    ? `<circle cx="23" cy="23" r="20" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.9"/>`
    : '';

  const badge = venue.events?.length > 0
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

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -26],
  });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 0.7 });
  }, [target, map]);
  return null;
}

function VenuePopup({ venue, onCheckin }) {
  const todayEvents = venue.events?.filter(e => isToday(e.date)) || [];
  const upcomingEvents = venue.events?.filter(e => !isToday(e.date)) || [];
  const shortAddr = venue.address
    ? venue.address.replace(', Florianópolis', '').replace(', SC', '')
    : null;

  return (
    <div style={{ minWidth: 210, maxWidth: 240, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: '#eef5f0', marginBottom: 3, lineHeight: 1.3 }}>
        {venue.name}
      </div>
      {shortAddr && (
        <div style={{ fontSize: 11, color: '#7a9a82', marginBottom: 8 }}>📍 {shortAddr}</div>
      )}

      {venue.checkin_count > 0 && (
        <div style={{ fontSize: 12, color: '#ff6d00', fontWeight: 700, marginBottom: 8, background: 'rgba(255,109,0,0.1)', borderRadius: 8, padding: '4px 8px', display: 'inline-block' }}>
          🔥 {venue.checkin_count} check-ins agora
        </div>
      )}

      {todayEvents.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#00e676', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Hoje</div>
          {todayEvents.map(e => (
            <div key={e.id} style={{ background: 'rgba(0,230,118,0.07)', borderRadius: 8, padding: '5px 8px', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#eef5f0' }}>{e.title}</div>
              <div style={{ fontSize: 11, color: '#7a9a82' }}>
                {new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {' · '}<span style={{ color: VIBE_COLOR[e.vibe_status] || '#a8bfaf' }}>{e.vibe_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7a9a82', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Próximos ({upcomingEvents.length})
          </div>
          {upcomingEvents.slice(0, 2).map(e => (
            <div key={e.id} style={{ fontSize: 12, color: '#a8bfaf', marginBottom: 2 }}>
              {new Date(e.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              {' — '}{e.title}
            </div>
          ))}
          {upcomingEvents.length > 2 && (
            <div style={{ fontSize: 11, color: '#5a7060' }}>+{upcomingEvents.length - 2} eventos</div>
          )}
        </div>
      )}

      {venue.events?.length === 0 && (
        <div style={{ fontSize: 12, color: '#5a7060', marginBottom: 8 }}>Sem programação esta semana</div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={() => onCheckin(venue)}
          style={{
            flex: 1, background: '#00e676', color: '#060908', border: 'none',
            borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          📍 Check-in
        </button>
        {venue.instagram && (
          <a
            href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
            target="_blank" rel="noreferrer"
            style={{
              background: 'rgba(255,255,255,0.07)', color: '#eef5f0',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '7px 10px', fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}
          >
            IG
          </a>
        )}
      </div>
    </div>
  );
}

export default function MapView() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/events/map')
      .then(r => setVenues(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCheckin(venue) {
    try {
      await api.post('/checkins', { venue_id: venue.id });
      setVenues(prev => prev.map(v =>
        v.id === venue.id ? { ...v, checkin_count: v.checkin_count + 1 } : v
      ));
    } catch {}
  }

  // Filter logic
  const visible = venues.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'hot')    return v.checkin_count > 0;
    if (filter === 'today')  return v.events?.some(e => isToday(e.date));
    if (filter === 'week')   return v.events?.length > 0;
    if (filter === 'bar')    return v.category === 'bar';
    if (filter === 'balada') return v.category === 'balada';
    return true;
  });

  const hotCount = venues.filter(v => v.checkin_count > 0).length;
  const todayCount = venues.filter(v => v.events?.some(e => isToday(e.date))).length;
  const weekCount = venues.filter(v => v.events?.length > 0).length;

  const labelOf = (f) => {
    if (f === 'hot') return `${hotCount} quentes`;
    if (f === 'today') return `${todayCount} hoje`;
    if (f === 'week') return `${weekCount} esta semana`;
    return `${visible.length} locais`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100svh - 130px)' }}>

      {/* Search + filters */}
      <div style={{ padding: '10px 16px 8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="search-bar" style={{ marginBottom: 0 }}>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Buscar local no mapa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => {
            const count = f.id === 'hot' ? hotCount : f.id === 'today' ? todayCount : f.id === 'week' ? weekCount : null;
            if (f.id === 'hot' && hotCount === 0) return null;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  flexShrink: 0,
                  background: filter === f.id ? 'var(--accent-dim)' : 'var(--surface2)',
                  border: `1.5px solid ${filter === f.id ? 'var(--accent)' : 'var(--border2)'}`,
                  color: filter === f.id ? 'var(--accent)' : 'var(--text2)',
                  borderRadius: 999, padding: '5px 13px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {f.emoji} {f.label}{count !== null ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Carregando mapa...
          </div>
        ) : (
          <MapContainer
            center={FLORIPA}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
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
                eventHandlers={{
                  click: () => { setSelected(v); setFlyTarget(v); },
                }}
              >
                <Popup>
                  <VenuePopup venue={v} onCheckin={handleCheckin} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Stats badge */}
        {!loading && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: 'rgba(6,9,8,0.88)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border2)', borderRadius: 999,
            padding: '7px 18px', fontSize: 12, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}>
            📍 {labelOf(filter)}
          </div>
        )}
      </div>
    </div>
  );
}
