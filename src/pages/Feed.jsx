import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import { useBora } from '../hooks/useBora';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../hooks/useSaved';
import { useToast } from '../context/ToastContext';

const VENUE_EMOJIS = ['🍸', '🎵', '🏖️', '🌆', '🎉', '🍻'];
const VENUE_BG = [
  'radial-gradient(circle at 30% 30%, #0d2e1a 0%, #061008 100%)',
  'radial-gradient(circle at 70% 30%, #13082e 0%, #070410 100%)',
  'radial-gradient(circle at 30% 70%, #082e24 0%, #040f0c 100%)',
  'radial-gradient(circle at 60% 60%, #1a2208 0%, #0a100a 100%)',
  'radial-gradient(circle at 50% 20%, #2e1408 0%, #100804 100%)',
  'radial-gradient(circle at 20% 80%, #081a2e 0%, #040810 100%)',
];

const CATEGORIES = [
  { id: null,         label: 'Todos',       emoji: '✨' },
  { id: 'rua',        label: 'Rolê na Rua', emoji: '🌆' },
  { id: 'bar',        label: 'Barzinho',    emoji: '🍺' },
  { id: 'balada',     label: 'Balada',      emoji: '💃' },
  { id: 'cultura',    label: 'Cultura',     emoji: '🎭' },
  { id: 'temporario', label: 'Especial',    emoji: '⚡' },
];

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

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-cover" />
      <div className="skeleton-body">
        <div className="skeleton-line w-70" />
        <div className="skeleton-line w-45" />
        <div className="skeleton-line w-55" />
        <div className="skeleton-chips">
          <div className="skeleton-chip" />
          <div className="skeleton-chip" />
          <div className="skeleton-chip" />
        </div>
      </div>
    </div>
  );
}

const NEIGHBORHOODS = [
  { id: 'Centro',            label: 'Centro' },
  { id: 'Lagoa da Conceição', label: 'Lagoa' },
  { id: 'Jurerê',            label: 'Jurerê' },
  { id: 'Ingleses',          label: 'Ingleses' },
  { id: 'Canasvieiras',      label: 'Canasvieiras' },
  { id: 'Trindade',          label: 'Trindade' },
  { id: 'Campeche',          label: 'Campeche' },
  { id: 'Beira-Mar',         label: 'Beira-Mar' },
];

const PAGE_SIZE = 20;

export default function Feed() {
  usePageTitle(null);
  const { user } = useAuth();
  const { savedIds, toggle: toggleSaved } = useSaved(!!user);
  const [events, setEvents] = useState([]);
  const [newVenues, setNewVenues] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [activeNeighborhood, setActiveNeighborhood] = useState(null);
  const [openNow, setOpenNow] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [todayEvents, setTodayEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [retryKey, setRetryKey] = useState(0);
  const [sortBy, setSortBy] = useState(null); // null | 'date' | 'popular'
  const [suggestions, setSuggestions] = useState(null); // {events, venues} | null
  const [showSuggestions, setShowSuggestions] = useState(false);

  const toast = useToast();
  const eventIds = useMemo(() => events.map(e => e.id), [events]);
  const { counts: boraCounts, toggle: _toggleBora } = useBora(eventIds);
  const toggleBora = useCallback(async (eventId) => {
    await _toggleBora(eventId);
    const reacted = !boraCounts[eventId]?.reacted;
    if (reacted) toast?.show('Tô dentro! 🚀', 'success');
  }, [_toggleBora, boraCounts, toast]);

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
    if (query.length < 2) { setSuggestions(null); setShowSuggestions(false); return; }
    const t = setTimeout(() => {
      api.get('/search', { params: { q: query } })
        .then(r => { setSuggestions(r.data); setShowSuggestions(true); })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    api.get('/events/tags').then(r => setTags(r.data)).catch(() => {});
    api.get('/events/new-venues').then(r => setNewVenues(r.data)).catch(() => {});
    api.get('/events/feed', { params: { today: true, limit: 10 } })
      .then(r => setTodayEvents(r.data)).catch(() => {});
    api.get('/events/trending').then(r => setTrendingEvents(r.data)).catch(() => {});
  }, []);

  function buildParams(currentOffset) {
    const params = { limit: PAGE_SIZE, offset: currentOffset };
    if (activeCategory) params.category = activeCategory;
    if (activeTag) params.tag = activeTag;
    if (activeNeighborhood) params.neighborhood = activeNeighborhood;
    if (openNow) params.open_now = true;
    if (accessible) params.accessible = true;
    if (query) params.q = query;
    if (sortBy) params.sort = sortBy;
    return params;
  }

  // Reset and refetch when filters change
  useEffect(() => {
    setLoading(true);
    setError(false);
    setOffset(0);
    setHasMore(false);
    const t = setTimeout(() => {
      api.get('/events/feed', { params: buildParams(0) })
        .then(r => {
          let data = r.data;
          if (hasPrefs && !activeCategory && !activeTag && !query) {
            data = [...data].sort((a, b) => scoreEvent(b, prefMusic, prefVibes) - scoreEvent(a, prefMusic, prefVibes));
          }
          setEvents(data);
          setHasMore(data.length === PAGE_SIZE);
        })
        .catch(() => { setError(true); setEvents([]); })
        .finally(() => setLoading(false));
    }, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [activeCategory, activeTag, activeNeighborhood, openNow, accessible, query, sortBy, retryKey]);

  function loadMore() {
    const nextOffset = offset + PAGE_SIZE;
    setLoadingMore(true);
    api.get('/events/feed', { params: buildParams(nextOffset) })
      .then(r => {
        setEvents(prev => [...prev, ...r.data]);
        setOffset(nextOffset);
        setHasMore(r.data.length === PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  const hasFilter = activeCategory || activeTag || activeNeighborhood || openNow || accessible || query;

  return (
    <div>
      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar rolê, local..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            aria-label="Buscar eventos"
            aria-autocomplete="list"
          />
          {showSuggestions && suggestions && (
            <div className="search-suggestions" role="listbox">
              {suggestions.events.slice(0, 4).map(e => (
                <button
                  key={`ev-${e.id}`}
                  className="suggestion-item"
                  onMouseDown={() => { setSelected(e); setShowSuggestions(false); }}
                  role="option"
                >
                  <span className="suggestion-icon">🎉</span>
                  <span className="suggestion-label">{e.title}</span>
                  <span className="suggestion-sub">{e.venue.name}</span>
                </button>
              ))}
              {suggestions.venues.slice(0, 3).map(v => (
                <button
                  key={`ve-${v.id}`}
                  className="suggestion-item"
                  onMouseDown={() => { setQuery(v.name); setShowSuggestions(false); }}
                  role="option"
                >
                  <span className="suggestion-icon">📍</span>
                  <span className="suggestion-label">{v.name}</span>
                  <span className="suggestion-sub">{v.city}</span>
                </button>
              ))}
              {suggestions.events.length === 0 && suggestions.venues.length === 0 && (
                <div className="suggestion-empty">Nenhum resultado</div>
              )}
            </div>
          )}
        </div>
        <button
          className={`filter-btn-icon${showTagFilter ? ' active' : ''}`}
          onClick={() => setShowTagFilter(v => !v)}
          aria-label="Filtrar por estilo musical"
          aria-pressed={showTagFilter}
        >🎵</button>
        <button
          className={`filter-btn-icon${openNow ? ' active' : ''}`}
          onClick={() => setOpenNow(v => !v)}
          aria-label="Mostrar apenas abertos agora"
          aria-pressed={openNow}
        >🟢</button>
        <button
          className={`filter-btn-icon${accessible ? ' active' : ''}`}
          onClick={() => setAccessible(v => !v)}
          aria-label="Mostrar apenas locais acessíveis"
          aria-pressed={accessible}
        >♿</button>
      </div>

      {showTagFilter && (
        <div className="filter-chips" role="group" aria-label="Estilos musicais">
          <button className={`chip${!activeTag ? ' active' : ''}`} onClick={() => setActiveTag(null)}>Todos</button>
          {tags.map(tag => (
            <button key={tag} className={`chip${activeTag === tag ? ' active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              aria-pressed={activeTag === tag}
            >{tag}</button>
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

      {/* Hoje */}
      {todayEvents.length > 0 && !hasFilter && (
        <>
          <div className="section-header">
            <div className="section-title today-title">🔥 Acontece Hoje</div>
            <span className="section-link today-badge">{todayEvents.length} eventos</span>
          </div>
          <div className="today-scroll">
            {todayEvents.map(event => {
              const t = new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              return (
                <button
                  key={event.id}
                  className="today-chip"
                  onClick={() => setSelected(event)}
                  aria-label={`${event.title} às ${t}`}
                >
                  <span className="today-chip-time">{t}</span>
                  <span className="today-chip-name">{event.title}</span>
                  <span className="today-chip-venue">{event.venue.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Em Alta */}
      {trendingEvents.length > 0 && !hasFilter && (
        <>
          <div className="section-header">
            <div className="section-title">🔥 Em Alta agora</div>
            <span className="section-link">{trendingEvents.length} rolês</span>
          </div>
          <div className="today-scroll">
            {trendingEvents.map(event => (
              <button
                key={event.id}
                className="today-chip today-chip-hot"
                onClick={() => setSelected(event)}
                aria-label={`${event.title} em ${event.venue.name}`}
              >
                <span className="today-chip-name">{event.title}</span>
                <span className="today-chip-venue">{event.venue.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Categorias */}
      <div className="category-tabs" role="tablist" aria-label="Categorias">
        {CATEGORIES.map(cat => (
          <button key={String(cat.id)}
            className={`cat-tab${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            role="tab"
            aria-selected={activeCategory === cat.id}
          >
            <span className="cat-emoji" aria-hidden="true">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Bairros */}
      <div className="neighborhood-chips" role="group" aria-label="Filtrar por bairro">
        <button
          className={`neighborhood-chip${!activeNeighborhood ? ' active' : ''}`}
          onClick={() => setActiveNeighborhood(null)}
        >📍 Todos</button>
        {NEIGHBORHOODS.map(n => (
          <button
            key={n.id}
            className={`neighborhood-chip${activeNeighborhood === n.id ? ' active' : ''}`}
            onClick={() => setActiveNeighborhood(activeNeighborhood === n.id ? null : n.id)}
            aria-pressed={activeNeighborhood === n.id}
          >{n.label}</button>
        ))}
      </div>

      {/* Banners de filtro ativos */}
      {(openNow || accessible || activeNeighborhood) && (
        <div className="active-filter-banners">
          {activeNeighborhood && (
            <div className="filter-banner filter-banner-cyan">
              📍 {NEIGHBORHOODS.find(n => n.id === activeNeighborhood)?.label || activeNeighborhood}
              <button onClick={() => setActiveNeighborhood(null)} aria-label="Remover filtro de bairro">✕</button>
            </div>
          )}
          {openNow && (
            <div className="filter-banner filter-banner-green">
              🟢 Aberto agora
              <button onClick={() => setOpenNow(false)} aria-label="Remover filtro aberto agora">✕</button>
            </div>
          )}
          {accessible && (
            <div className="filter-banner filter-banner-blue">
              ♿ Acessível
              <button onClick={() => setAccessible(false)} aria-label="Remover filtro acessível">✕</button>
            </div>
          )}
        </div>
      )}

      {/* Header resultados */}
      <div className="section-header">
        <div className="section-title">
          {hasPrefs && !hasFilter ? '⭐ Para você' : query ? `"${query}"` : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'Em destaque'}
        </div>
        <div className="sort-chips">
          <button className={`sort-chip${!sortBy ? ' active' : ''}`} onClick={() => setSortBy(null)}>★</button>
          <button className={`sort-chip${sortBy === 'date' ? ' active' : ''}`} onClick={() => setSortBy('date')}>📅</button>
          <button className={`sort-chip${sortBy === 'popular' ? ' active' : ''}`} onClick={() => setSortBy('popular')}>🔥</button>
        </div>
      </div>

      {loading ? (
        <div className="events-list">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="feed-error">
          <div className="feed-error-icon">😵</div>
          <p>Não conseguimos carregar os rolês</p>
          <button className="btn-retry" onClick={() => setRetryKey(k => k + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {query ? '🔍' : accessible ? '♿' : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.emoji || '🎉' : '😕'}
          </div>
          <p>{query ? `Nenhum resultado para "${query}"` : 'Nenhum rolê encontrado'}</p>
          {accessible && <p className="empty-hint">Tenta remover o filtro de acessibilidade</p>}
          {(activeCategory || activeTag || accessible || openNow || activeNeighborhood) && (
            <button
              className="btn-retry"
              onClick={() => {
                setActiveCategory(null);
                setActiveTag(null);
                setAccessible(false);
                setOpenNow(false);
                setActiveNeighborhood(null);
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="events-list">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelected(event)}
                boraCount={boraCounts[event.id]?.count || 0}
                boraReacted={boraCounts[event.id]?.reacted || false}
                onBora={toggleBora}
                isSaved={savedIds.has(event.id)}
                onSave={user ? toggleSaved : null}
                hero={i === 0 && event.is_featured && !hasFilter}
              />
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button
                className="btn-load-more"
                onClick={loadMore}
                disabled={loadingMore}
                aria-label="Carregar mais eventos"
              >
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
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
