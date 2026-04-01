import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const CAT_EMOJI = { bar: '🍺', balada: '💃', cultura: '🎭', rua: '🌆' };

export default function Venues() {
  const [venues, setVenues]   = useState([]);
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams({ city: 'Florianópolis' });
      if (query) params.set('q', query);
      api.get(`/events/venues?${params}`)
        .then(r => setVenues(r.data))
        .catch(() => setVenues([]))
        .finally(() => setLoading(false));
    }, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [query]);

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

      <div className="section-header">
        <div className="section-title">Locais em Floripa</div>
        <span className="section-link">{venues.length} locais</span>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : venues.length === 0 ? (
        <div className="empty-state"><p>Nenhum local encontrado</p></div>
      ) : (
        <div className="venue-list">
          {venues.map(venue => (
            <VenueRow key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}

function VenueRow({ venue }) {
  const ig = venue.instagram;
  const hasContact = ig || venue.whatsapp;

  return (
    <div className="venue-row">
      <div className="venue-row-icon">
        {venue.logo_url
          ? <img src={venue.logo_url} alt={venue.name} className="venue-row-img" />
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
      </div>
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
  );
}
