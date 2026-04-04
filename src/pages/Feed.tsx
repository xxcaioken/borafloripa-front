import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { EventOut, VenueOut } from '../services/api';
import EventDetail from '../components/EventDetail';
import { useBora } from '../hooks/useBora';
import { useAuth } from '../context/AuthContext';
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

const CATEGORY_LABEL: Record<string, string> = {
  bar: 'Bar', balada: 'Balada', cultura: 'Cultura', rua: 'Rolê na Rua', temporario: 'Especial'
};

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

// Music/vibe preferences → venue category affinity
const MUSIC_TO_CATEGORY: Record<string, string> = {
  funk:       'balada',  // funk em Floripa = pista de dança
  eletronico: 'balada',
  sertanejo:  'balada',
  pop:        'balada',
  pagode:     'bar',
  rock:       'bar',
  mpb:        'cultura',
  reggae:     'cultura',
};
const VIBE_TO_CATEGORY: Record<string, string> = {
  'universitário': 'balada',
  'rooftop':       'bar',
  'happy-hour':    'bar',
  'chopp':         'bar',
  'comer-beber':   'bar',
  'litrão':        'bar',
  'pet-friendly':  'bar',
  'tv-esportes':   'bar',
};

function scoreVenue(venue: VenueOut, prefMusic: string[], prefVibes: string[]): number {
  let score = (venue.checkin_count || 0) * 0.5;
  prefMusic.forEach(id => { if (MUSIC_TO_CATEGORY[id] === venue.category) score += 2; });
  prefVibes.forEach(id => { if (VIBE_TO_CATEGORY[id] === venue.category) score += 1; });
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

interface VenueCardProps {
  venue: VenueOut;
  index: number;
  score: number;
}

function VenueCard({ venue, index, score }: VenueCardProps) {
  const navigate = useNavigate();
  const isHot = (venue.checkin_count || 0) >= 5;
  const isMatch = !isHot && (score || 0) >= 2;
  return (
    <div className="venue-grid-card" onClick={() => navigate(`/venue/${venue.id}`)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(`/venue/${venue.id}`)}>
      <div className="venue-grid-card-cover" style={{ background: VENUE_BG[index % VENUE_BG.length] }}>
        <span className="venue-grid-card-emoji">{VENUE_EMOJIS[index % VENUE_EMOJIS.length]}</span>
        {isHot && <span className="venue-grid-hot">🔥 Hot</span>}
        {venue.is_new && !isHot && <span className="venue-grid-new">Novo</span>}
        {isMatch && <span className="venue-grid-match">✨ Match</span>}
        {venue.wheelchair && <span className="venue-grid-access">♿</span>}
      </div>
      <div className="venue-grid-card-info">
        <p className="venue-grid-name">{venue.name}</p>
        <span className="venue-grid-cat">{CATEGORY_LABEL[venue.category || ''] || venue.category || venue.city}</span>
      </div>
    </div>
  );
}

interface SearchSuggestions {
  venues: VenueOut[];
  events: EventOut[];
}

export default function Feed() {
  usePageTitle(null);
  const { user } = useAuth();
  const [allVenues, setAllVenues] = useState<VenueOut[]>([]);
  const [newVenues, setNewVenues] = useState<VenueOut[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeNeighborhood, setActiveNeighborhood] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<EventOut | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [todayEvents, setTodayEvents] = useState<EventOut[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<EventOut[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null); // null | 'popular' | 'name'
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const toast = useToast();

  // Bora for event chips
  const eventIds = useMemo(() => [
    ...todayEvents.map(e => e.id),
    ...trendingEvents.map(e => e.id),
  ], [todayEvents, trendingEvents]);
  const { counts: boraCounts, toggle: _toggleBora } = useBora(eventIds);
  const toggleBora = useCallback(async (eventId: number) => {
    await _toggleBora(eventId);
    if (!boraCounts[eventId]?.reacted) toast?.show('Tô dentro! 🚀', 'success');
  }, [_toggleBora, boraCounts, toast]);

  const prefMusic = useMemo(() => {
    if (user?.pref_music) { try { return JSON.parse(user.pref_music); } catch { return []; } }
    try { return JSON.parse(localStorage.getItem('bf_pref_music') || '[]'); } catch { return []; }
  }, [user?.pref_music]);

  const prefVibes = useMemo(() => {
    if (user?.pref_vibes) { try { return JSON.parse(user.pref_vibes); } catch { return []; } }
    try { return JSON.parse(localStorage.getItem('bf_pref_vibes') || '[]'); } catch { return []; }
  }, [user?.pref_vibes]);

  const hasPrefs = prefMusic.length > 0 || prefVibes.length > 0;

  // Search suggestions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.length < 2) { setSuggestions(null); setShowSuggestions(false); return; }
    const t = setTimeout(() => {
      api.get('/search', { params: { q: query } })
        .then(r => { setSuggestions(r.data); setShowSuggestions(true); })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Initial data load
  useEffect(() => {
    api.get('/events/tags').then(r => setTags(r.data)).catch(() => {});
    api.get('/events/new-venues').then(r => setNewVenues(r.data)).catch(() => {});
    api.get('/events/feed', { params: { today: true, limit: 10 } })
      .then(r => setTodayEvents(r.data)).catch(() => {});
    api.get('/events/trending').then(r => setTrendingEvents(r.data)).catch(() => {});
  }, []);

  // Fetch venues when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    const params: Record<string, string> = {};
    if (activeCategory) params.category = activeCategory;
    if (activeNeighborhood) params.neighborhood = activeNeighborhood;
    if (query) params.q = query;

    const t = setTimeout(() => {
      api.get('/events/venues', { params })
        .then(r => setAllVenues(r.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [activeCategory, activeNeighborhood, query, retryKey]);

  // Client-side: score + sort + accessibility filter
  const venues = useMemo(() => {
    let result = accessible ? allVenues.filter(v => v.wheelchair) : allVenues;

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.checkin_count || 0) - (a.checkin_count || 0));
    } else if (hasPrefs && !activeCategory && !query) {
      result = [...result].sort((a, b) => scoreVenue(b, prefMusic, prefVibes) - scoreVenue(a, prefMusic, prefVibes));
    }

    return result;
  }, [allVenues, accessible, sortBy, hasPrefs, prefMusic, prefVibes, activeCategory, query]);

  const hasFilter = activeCategory || activeTag || activeNeighborhood || openNow || accessible || query;

  return (
    <div>
      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar local..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            aria-label="Buscar local"
            aria-autocomplete="list"
          />
          {showSuggestions && suggestions && (
            <div className="search-suggestions" role="listbox">
              {suggestions.venues.slice(0, 5).map(v => (
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
              {suggestions.events.slice(0, 2).map(e => (
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

      {/* Acontece Hoje — eventos */}
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

      {/* Em Alta — eventos */}
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

      {/* Novidades — venues novos */}
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

      {/* Banners de filtros ativos */}
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
          {hasPrefs && !hasFilter ? '⭐ Para você' : query ? `"${query}"` : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : 'Lugares'}
        </div>
        <div className="sort-chips">
          <button className={`sort-chip${!sortBy ? ' active' : ''}`} onClick={() => setSortBy(null)} title="Recomendados">★</button>
          <button className={`sort-chip${sortBy === 'popular' ? ' active' : ''}`} onClick={() => setSortBy('popular')} title="Mais movimentados">🔥</button>
          <button className={`sort-chip${sortBy === 'name' ? ' active' : ''}`} onClick={() => setSortBy('name')} title="A-Z">🔤</button>
        </div>
      </div>

      {/* Lista de venues */}
      {loading ? (
        <div className="events-list">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : error ? (
        <div className="feed-error">
          <div className="feed-error-icon">😵</div>
          <p>Não conseguimos carregar os locais</p>
          <button className="btn-retry" onClick={() => setRetryKey(k => k + 1)}>Tentar novamente</button>
        </div>
      ) : venues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {query ? '🔍' : accessible ? '♿' : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.emoji || '📍' : '📍'}
          </div>
          <p>{query ? `Nenhum resultado para "${query}"` : 'Nenhum local encontrado'}</p>
          {(activeCategory || accessible || activeNeighborhood) && (
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
        <div className="venue-grid">
          {venues.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} index={i} score={scoreVenue(venue, prefMusic, prefVibes)} />
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
