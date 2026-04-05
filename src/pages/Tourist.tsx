import { usePageTitle } from '../hooks/usePageTitle';
import React, { useState, lazy, Suspense } from 'react';
import { api } from '../services/api';
import type { EventOut } from '../services/api';
import EventCard from '../components/EventCard';
const EventDetail = lazy(() => import('../components/EventDetail'));
import { useBora } from '../hooks/useBora';

function groupByDate(events: EventOut[]): [string, EventOut[]][] {
  const map = new Map<string, EventOut[]>();
  for (const e of events) {
    const key = e.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()];
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return '📅 Hoje';
  if (d.toDateString() === tomorrow.toDateString()) return '📅 Amanhã';
  return '📅 ' + d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const PERIODS = [
  { id: null,     label: 'Dia todo', emoji: '☀️' },
  { id: 'manha',  label: 'Manhã',    emoji: '🌅' },
  { id: 'tarde',  label: 'Tarde',    emoji: '🌞' },
  { id: 'noite',  label: 'Noite',    emoji: '🌙' },
];

export default function Tourist() {
  usePageTitle('Modo Turista');
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [period, setPeriod] = useState<string | null>(null);
  const [events, setEvents] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<EventOut | null>(null);

  const eventIds = events.map(e => e.id);
  const { counts: boraCounts, toggle: toggleBora } = useBora(eventIds);

  async function search() {
    setLoading(true);
    setSearched(true);
    setError(false);
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (period) params.set('period', period);
    try {
      const r = await api.get(`/events/tourist?${params}`);
      setEvents(r.data);
    } catch {
      setError(true);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-header tourist-header">
        <div className="section-title">✈️ Modo Turista</div>
      </div>
      <p className="tourist-subtitle">Monte seu roteiro de rolês por período e datas.</p>

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

        <div className="category-tabs tourist-periods">
          {PERIODS.map(p => (
            <button
              key={String(p.id)}
              className={`cat-tab${period === p.id ? ' active' : ''}`}
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
            >
              <span className="cat-emoji" aria-hidden="true">{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <button className="btn-primary btn-block" onClick={search}>
          Buscar rolês
        </button>
      </div>

      {loading && <div className="loading">Montando seu roteiro...</div>}

      {!loading && error && (
        <div className="feed-error">
          <div className="feed-error-icon">😵</div>
          <p>Não conseguimos buscar os eventos</p>
          <button className="btn-retry" onClick={search}>Tentar novamente</button>
        </div>
      )}

      {!loading && !error && searched && events.length === 0 && (
        <div className="empty-state">
          <p>Nenhum rolê encontrado nesse período 😕</p>
          <p className="empty-hint">Tente ajustar as datas ou o período do dia.</p>
        </div>
      )}

      {events.length > 0 && (
        <>
          <div className="section-header tourist-results-header">
            <div className="section-title">Seu roteiro</div>
            <span className="section-link">{events.length} rolês</span>
          </div>
          {groupByDate(events).map(([dateKey, group]) => (
            <div key={dateKey} className="tourist-day-group">
              <div className="tourist-day-label">{formatDateLabel(dateKey)}</div>
              <div className="events-list">
                {group.map(event => (
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
          ))}
        </>
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
