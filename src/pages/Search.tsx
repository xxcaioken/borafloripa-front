import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { EventOut, VenueOut } from '../services/api';
import EventCard from '../components/EventCard';
import { useBora } from '../hooks/useBora';
const EventDetail = lazy(() => import('../components/EventDetail'));

type SearchTab = 'all' | 'events' | 'venues';

interface SearchResults {
  events: EventOut[];
  venues: VenueOut[];
}

const HINTS = ['Samba', 'Eletrônico', 'Rooftop', 'Happy Hour', 'Pet Friendly', 'Rock', 'Pagode'];

export default function Search() {
  usePageTitle('Busca');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tab, setTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResults>({ events: [], venues: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<EventOut | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { counts: boraCounts, toggle: toggleBora } = useBora(results.events.map(e => e.id));

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults({ events: [], venues: [] });
      setSearched(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      api.get('/search', { params: { q, limit: 12 } })
        .then(r => { setResults(r.data); setSearched(true); })
        .catch(() => setResults({ events: [], venues: [] }))
        .finally(() => setLoading(false));
      setSearchParams(q ? { q } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const total = results.events.length + results.venues.length;
  const showEvents = tab === 'all' || tab === 'events';
  const showVenues = tab === 'all' || tab === 'venues';

  return (
    <div className="search-page">
      <div className="search-bar search-bar-mb">
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Eventos, bares, baladas..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Buscar"
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              aria-label="Limpar busca"
            >✕</button>
          )}
        </div>
      </div>

      {searched && (
        <div className="category-tabs venues-cat-tabs" role="tablist" aria-label="Tipo de resultado">
          {([
            ['all',    `Tudo (${total})`,                    '✨'],
            ['events', `Eventos (${results.events.length})`, '📅'],
            ['venues', `Locais (${results.venues.length})`,  '🍸'],
          ] as [SearchTab, string, string][]).map(([id, label, emoji]) => (
            <button
              key={id}
              className={`cat-tab${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
              role="tab"
              aria-selected={tab === id}
            >
              <span className="cat-emoji" aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="search-loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card skeleton-venue" aria-hidden="true">
              <div className="skeleton-cover skeleton-venue-icon" />
              <div className="skeleton-body">
                <div className="skeleton-line w-70" />
                <div className="skeleton-line w-45" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && total === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>Nenhum resultado para "{query}"</p>
        </div>
      )}

      {!loading && searched && (
        <>
          {showEvents && results.events.length > 0 && (
            <div className="search-section">
              <div className="section-header">
                <div className="section-title">Eventos</div>
              </div>
              <div className="events-list">
                {results.events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelected(event)}
                    boraCount={boraCounts[event.id]?.count || 0}
                    boraReacted={boraCounts[event.id]?.reacted || false}
                    onBora={toggleBora}
                  />
                ))}
              </div>
            </div>
          )}

          {showVenues && results.venues.length > 0 && (
            <div className="search-section">
              <div className="section-header">
                <div className="section-title">Locais</div>
              </div>
              <div className="venue-list">
                {results.venues.map(venue => (
                  <div
                    key={venue.id}
                    className="venue-row venue-row-clickable"
                    onClick={() => navigate(`/venue/${venue.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/venue/${venue.id}`)}
                  >
                    <div className="venue-row-info">
                      <div className="venue-row-name">{venue.name}</div>
                      {venue.address && (
                        <div className="venue-row-addr">
                          {venue.address.replace(', Florianópolis', '').replace(', SC', '')}
                        </div>
                      )}
                      {venue.instagram && (
                        <div className="venue-row-meta">
                          <span className="venue-row-ig">{venue.instagram}</span>
                        </div>
                      )}
                    </div>
                    <span className="venue-row-chevron" aria-hidden="true">›</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="search-hints">
          <p className="search-hints-label">Tente buscar por</p>
          <div className="search-hint-chips">
            {HINTS.map(hint => (
              <button key={hint} className="search-hint-chip" onClick={() => setQuery(hint)}>
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <Suspense fallback={null}>
          <EventDetail
            event={selected}
            onClose={() => setSelected(null)}
            boraCount={boraCounts[selected.id]?.count || 0}
            boraReacted={boraCounts[selected.id]?.reacted || false}
            onBora={toggleBora}
          />
        </Suspense>
      )}
    </div>
  );
}
