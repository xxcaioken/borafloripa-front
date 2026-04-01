import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import { useBora } from '../hooks/useBora';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../hooks/useSaved';

const VENUE_EMOJIS = ['🍸', '🎵', '🏖️', '🌆', '🎉', '🍻'];
const VENUE_BG = ['#0a1a0e', '#0a0f1a', '#0a1a0a', '#121a0a', '#0a1a14', '#0a120a'];

const CATEGORIES = [
  { id: null,         label: 'Todos',       emoji: '✨' },
  { id: 'rua',        label: 'Rolê na Rua', emoji: '🌆' },
  { id: 'bar',        label: 'Barzinho',    emoji: '🍺' },
  { id: 'balada',     label: 'Balada',      emoji: '💃' },
  { id: 'cultura',    label: 'Cultura',     emoji: '🎭' },
  { id: 'temporario', label: 'Especial',    emoji: '⚡' },
];

// Mapa de IDs do onboarding → nomes de tags do backend
const MUSIC_TO_TAG = {
  funk: 'Funk', eletronico: 'Eletrônico', pagode: 'Pagode',
  sertanejo: 'Sertanejo', rock: 'Rock', mpb: 'MPB', reggae: 'Reggae', pop: null,
};
const VIBE_TO_TAG = {
  rooftop: 'Rooftop', 'pet-friendly': 'Pet Friendly', 'happy-hour': 'Happy Hour',
  chopp: 'Chopp Artesanal', 'comer-beber': 'Comer e Beber', 'tv-esportes': 'TV com Esportes',
  litrão: null, universitário: null,
};

function scoreEvent(event, prefMusic, prefVibes) {
  const eventTags = new Set(event.tags.map(t => t.name));
  let score = 0;
  prefMusic.forEach(id => { if (MUSIC_TO_TAG[id] && eventTags.has(MUSIC_TO_TAG[id])) score += 2; });
  prefVibes.forEach(id => { if (VIBE_TO_TAG[id] && eventTags.has(VIBE_TO_TAG[id])) score += 1; });
  if (event.is_featured) score += 0.5;
  return score;
}

export default function Feed() {
  const { user } = useAuth();
  const { savedIds, toggle: toggleSaved } = useSaved(!!user);
  const [events, setEvents] = useState([]);
  const [newVenues, setNewVenues] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [openNow, setOpenNow] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showTagFilter, setShowTagFilter] = useState(false);

  const eventIds = useMemo(() => events.map(e => e.id), [events]);
  const { counts: boraCounts, toggle: toggleBora } = useBora(eventIds);

  // Preferências: prioriza usuário logado, cai para localStorage do onboarding
  const prefMusic = useMemo(() => {
    if (user?.pref_music) {
      try { return JSON.parse(user.pref_music); } catch { return []; }
    }
    try { return JSON.parse(localStorage.getItem('bf_pref_music') || '[]'); } catch { return []; }
  }, [user?.pref_music]);
  const prefVibes = useMemo(() => {
    if (user?.pref_vibes) {
      try { return JSON.parse(user.pref_vibes); } catch { return []; }
    }
    try { return JSON.parse(localStorage.getItem('bf_pref_vibes') || '[]'); } catch { return []; }
  }, [user?.pref_vibes]);
  const hasPrefs = prefMusic.length > 0 || prefVibes.length > 0;

  useEffect(() => {
    api.get('/events/tags').then(r => setTags(r.data)).catch(() => {});
    api.get('/events/new-venues').then(r => setNewVenues(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ city: 'Florianópolis' });
    if (activeCategory) params.set('category', activeCategory);
    if (activeTag) params.set('tag', activeTag);
    if (openNow) params.set('open_now', 'true');
    if (accessible) params.set('accessible', 'true');
    if (query) params.set('q', query);
    const t = setTimeout(() => {
      api.get(`/events/feed?${params}`)
        .then(r => {
          let data = r.data;
          // Recomendação: reordena por score de preferência se não há filtros ativos
          if (hasPrefs && !activeCategory && !activeTag && !query) {
            data = [...data].sort((a, b) => scoreEvent(b, prefMusic, prefVibes) - scoreEvent(a, prefMusic, prefVibes));
          }
          setEvents(data);
        })
        .catch(() => setEvents([]))
        .finally(() => setLoading(false));
    }, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [activeCategory, activeTag, openNow, accessible, query]);

  const hasFilter = activeCategory || activeTag || openNow || accessible || query;

  return (
    <div>
      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar rolê, local..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button className={`filter-btn-icon${showTagFilter ? ' active' : ''}`} onClick={() => setShowTagFilter(v => !v)} title="Estilos">🎵</button>
        <button className={`filter-btn-icon${openNow ? ' active' : ''}`} onClick={() => setOpenNow(v => !v)} title="Aberto agora">🟢</button>
        <button className={`filter-btn-icon${accessible ? ' active' : ''}`} onClick={() => setAccessible(v => !v)} title="Acessível">♿</button>
      </div>

      {showTagFilter && (
        <div className="filter-chips">
          <button className={`chip${!activeTag ? ' active' : ''}`} onClick={() => setActiveTag(null)}>Todos</button>
          {tags.map(tag => (
            <button key={tag} className={`chip${activeTag === tag ? ' active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}>{tag}</button>
          ))}
        </div>
      )}

      {/* Novidades */}
      {newVenues.length > 0 && !hasFilter && (
        <>
          <div className="section-header">
            <div className="section-title">Acabaram de chegar! 🆕</div>
          </div>
          <div className="carousel-scroll">
            {newVenues.map((venue, i) => (
              <div key={venue.id} className="venue-card-mini">
                <div className="venue-card-mini-cover">
                  <div className="venue-card-mini-bg" style={{ background: VENUE_BG[i % VENUE_BG.length] }}>
                    {VENUE_EMOJIS[i % VENUE_EMOJIS.length]}
                  </div>
                  <span className="venue-card-mini-badge">Novo</span>
                  {venue.wheelchair && <span className="venue-card-mini-access">♿</span>}
                </div>
                <p>{venue.name}</p>
                <span>{venue.city}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Categorias */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button key={String(cat.id)}
            className={`cat-tab${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}>
            <span className="cat-emoji">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Banners ativos */}
      {(openNow || accessible) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {openNow && (
            <div className="open-now-banner" style={{ flex: 1 }}>
              🟢 Aberto agora
              <button onClick={() => setOpenNow(false)}>✕</button>
            </div>
          )}
          {accessible && (
            <div className="open-now-banner" style={{ flex: 1, borderColor: 'rgba(0,188,212,0.3)', color: 'var(--accent2)' }}>
              ♿ Acessível
              <button onClick={() => setAccessible(false)}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* Header resultados */}
      <div className="section-header">
        <div className="section-title">
          {hasPrefs && !hasFilter ? '⭐ Para você' : query ? `"${query}"` : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'Em destaque'}
        </div>
        <span className="section-link">{events.length} rolês</span>
      </div>

      {loading ? (
        <div className="loading">Carregando a vibe...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum rolê encontrado 😕</p>
          {accessible && <p style={{ marginTop: 8, fontSize: 13 }}>Nenhum local acessível com esse filtro</p>}
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelected(event)}
              boraCount={boraCounts[event.id]?.count || 0}
              boraReacted={boraCounts[event.id]?.reacted || false}
              onBora={toggleBora}
              isSaved={savedIds.has(event.id)}
              onSave={user ? toggleSaved : null}
            />
          ))}
        </div>
      )}

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
