import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { EventOut } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import EventCard from '../components/EventCard';
import { useBora } from '../hooks/useBora';
import { groupByDate, formatDateLabel, addDays, toDateKey } from '../utils/dateHelpers';

const EventDetail = lazy(() => import('../components/EventDetail'));

const DAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Agenda() {
  usePageTitle('Agenda Semanal');
  const navigate = useNavigate();

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const [activeDay, setActiveDay] = useState(toDateKey(today));
  const [allEvents, setAllEvents] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<EventOut | null>(null);

  const dateFrom = toDateKey(today);
  const dateTo = toDateKey(addDays(today, 6));

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.get('/events/tourist', { params: { date_from: dateFrom, date_to: dateTo } })
      .then(r => setAllEvents(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const grouped = groupByDate(allEvents);
  const dayEventMap = new Map(grouped);
  const activeDayEvents = dayEventMap.get(activeDay) || [];

  const eventIds = allEvents.map(e => e.id);
  const { counts: boraCounts, toggle: toggleBora } = useBora(eventIds);

  function countForDay(key: string) {
    return (dayEventMap.get(key) || []).length;
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">📅 Agenda Semanal</div>
        <button
          className="section-link"
          onClick={() => navigate('/turista')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Ver mais datas
        </button>
      </div>
      <p className="tourist-subtitle">Rolês dos próximos 7 dias em Floripa.</p>

      {/* Week strip */}
      <div className="week-strip" role="tablist" aria-label="Selecionar dia">
        {weekDays.map((day) => {
          const key = toDateKey(day);
          const count = countForDay(key);
          const isActive = key === activeDay;
          const abbr = DAY_ABBR[day.getDay()];
          const num = day.getDate();
          return (
            <button
              key={key}
              className={`week-day-btn${isActive ? ' active' : ''}${count > 0 ? ' has-events' : ''}`}
              onClick={() => setActiveDay(key)}
              role="tab"
              aria-selected={isActive}
              aria-label={`${abbr} ${num}${count > 0 ? `, ${count} evento${count > 1 ? 's' : ''}` : ''}`}
            >
              <span className="week-day-abbr">{abbr}</span>
              <span className="week-day-num">{num}</span>
              {count > 0 && <span className="week-day-dot" />}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="loading">Carregando agenda...</div>
      )}

      {!loading && error && (
        <div className="feed-error">
          <div className="feed-error-icon">😵</div>
          <p>Não conseguimos carregar os eventos</p>
          <button className="btn-retry" onClick={() => { setError(false); setLoading(true); api.get('/events/tourist', { params: { date_from: dateFrom, date_to: dateTo } }).then(r => setAllEvents(r.data)).catch(() => setError(true)).finally(() => setLoading(false)); }}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="section-header">
            <div className="section-title">{formatDateLabel(activeDay)}</div>
            <span className="section-link">{activeDayEvents.length} rolê{activeDayEvents.length !== 1 ? 's' : ''}</span>
          </div>

          {activeDayEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">😴</div>
              <p>Sem rolês nesse dia</p>
              <p className="empty-hint">Tente outro dia ou veja o calendário completo.</p>
              <button className="btn-retry" onClick={() => navigate('/turista')}>
                Ver calendário completo
              </button>
            </div>
          ) : (
            <div className="events-list">
              {activeDayEvents.map(event => (
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
          )}
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
