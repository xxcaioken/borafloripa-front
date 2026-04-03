import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFollowVenue } from '../hooks/useFollowVenue';

const CAT_EMOJI = { bar: '🍺', balada: '💃', cultura: '🎭', rua: '🌆' };
const CATS = [
  { id: null,     label: 'Todos',   emoji: '✨' },
  { id: 'bar',    label: 'Bares',   emoji: '🍺' },
  { id: 'balada', label: 'Baladas', emoji: '💃' },
  { id: 'cultura',label: 'Cultura', emoji: '🎭' },
  { id: 'rua',    label: 'Rua',     emoji: '🌆' },
];

export default function Venues() {
  usePageTitle('Locais');
  const { user } = useAuth();
  const { followedIds, toggle: toggleFollow } = useFollowVenue(!!user);
  const [venues, setVenues]   = useState([]);
  const [query, setQuery]     = useState('');
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const params = {};
      if (query) params.q = query;
      if (category) params.category = category;
      api.get('/events/venues', { params })
        .then(r => setVenues(r.data))
        .catch(() => setVenues([]))
        .finally(() => setLoading(false));
    }, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [query, category]);

  return (
    <div>
      <div className="search-bar search-bar-mb">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar local..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="category-tabs venues-cat-tabs" role="tablist" aria-label="Tipo de local">
        {CATS.map(cat => (
          <button
            key={String(cat.id)}
            className={`cat-tab${category === cat.id ? ' active' : ''}`}
            onClick={() => setCategory(cat.id)}
            role="tab"
            aria-selected={category === cat.id}
          >
            <span className="cat-emoji" aria-hidden="true">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="section-header">
        <div className="section-title">Locais em Floripa</div>
        <span className="section-link">{venues.length} locais</span>
      </div>

      {loading ? (
        <div className="venue-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-card skeleton-venue" aria-hidden="true">
              <div className="skeleton-cover skeleton-venue-icon" />
              <div className="skeleton-body">
                <div className="skeleton-line w-70" />
                <div className="skeleton-line w-45" />
                <div className="skeleton-line w-55" />
              </div>
            </div>
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🏙️</div><p>Nenhum local encontrado</p></div>
      ) : (
        <div className="venue-list">
          {venues.map(venue => (
            <VenueRow
              key={venue.id}
              venue={venue}
              isFollowed={followedIds.has(venue.id)}
              onFollow={user ? () => toggleFollow(venue.id) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VenueRow({ venue, isFollowed, onFollow }) {
  const ig = venue.instagram;
  const hasContact = ig || venue.whatsapp;

  return (
    <div className="venue-row">
      <div className="venue-row-icon">
        {venue.logo_url
          ? <img src={venue.logo_url} alt={venue.name} className="venue-row-img" loading="lazy" />
          : <span>{CAT_EMOJI[venue.category] || '🍸'}</span>
        }
      </div>
      <div className="venue-row-info">
        <div className="venue-row-name">{venue.name}</div>
        {venue.address && venue.address !== 'Florianópolis, SC' && (
          <div className="venue-row-addr">{venue.address.replace(', Florianópolis', '').replace(', SC', '')}</div>
        )}
        <div className="venue-row-meta">
          {ig && <span className="venue-row-ig">{ig}</span>}
          {venue.whatsapp && <span className="venue-row-phone">📞 {venue.whatsapp}</span>}
          {!hasContact && <span className="venue-row-empty">Sem contato cadastrado</span>}
        </div>
        <div className="venue-row-a11y">
          {venue.wheelchair && <span title="Acessível">♿</span>}
          {venue.hearing_loop && <span title="Loop magnético">🦻</span>}
          {venue.visual_aid && <span title="Auxílio visual">👁️</span>}
          {venue.adapted_wc && <span title="WC adaptado">🚻</span>}
        </div>
      </div>
      <div className="venue-row-actions">
        {onFollow && (
          <button
            className={`venue-follow-btn${isFollowed ? ' following' : ''}`}
            onClick={onFollow}
            aria-label={isFollowed ? `Deixar de seguir ${venue.name}` : `Seguir ${venue.name}`}
            aria-pressed={isFollowed}
          >
            {isFollowed ? '✓ Seguindo' : '+ Seguir'}
          </button>
        )}
        {ig && (
          <a
            className="venue-row-action"
            href={`https://instagram.com/${ig.replace('@', '')}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver IG
          </a>
        )}
      </div>
    </div>
  );
}
