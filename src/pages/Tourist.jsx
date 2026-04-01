import React, { useState } from 'react';
import { api } from '../services/api';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import { useBora } from '../hooks/useBora';

const PERIODS = [
  { id: null,     label: 'Dia todo', emoji: '☀️' },
  { id: 'manha',  label: 'Manhã',    emoji: '🌅' },
  { id: 'tarde',  label: 'Tarde',    emoji: '🌞' },
  { id: 'noite',  label: 'Noite',    emoji: '🌙' },
];

export default function Tourist() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [period, setPeriod] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);

  const eventIds = events.map(e => e.id);
  const { counts: boraCounts, toggle: toggleBora } = useBora(eventIds);

  async function search() {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (period) params.set('period', period);
    try {
      const r = await api.get(`/events/tourist?${params}`);
      setEvents(r.data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 4 }}>
        <div className="section-title">✈️ Modo Turista</div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        Monte seu roteiro de rolês por período e datas.
      </p>

      <div className="tourist-form">
        <div className="form-row">
          <div className="form-group">
            <label>De</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Até</label>
            <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="category-tabs" style={{ marginBottom: 16 }}>
          {PERIODS.map(p => (
            <button
              key={String(p.id)}
              className={`cat-tab${period === p.id ? ' active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              <span className="cat-emoji">{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={search}>
          Buscar rolês
        </button>
      </div>

      {loading && <div className="loading">Montando seu roteiro...</div>}

      {!loading && searched && events.length === 0 && (
        <div className="empty-state">
          <p>Nenhum rolê encontrado nesse período 😕</p>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Tente ajustar as datas ou o período do dia.</p>
        </div>
      )}

      {events.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 20 }}>
            <div className="section-title">Seu roteiro</div>
            <span className="section-link">{events.length} rolês</span>
          </div>
          <div className="events-list">
            {events.map(event => (
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
