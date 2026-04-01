import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// ID anônimo persistido no browser — nunca muda
function getSessionId() {
  let id = localStorage.getItem('bf_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('bf_session_id', id);
  }
  return id;
}

/**
 * useBora(eventIds)
 * Retorna { counts, toggle }
 * counts: { [eventId]: { count: number, reacted: boolean } }
 * toggle(eventId): clica o botão Bora para aquele evento
 */
export function useBora(eventIds) {
  const [counts, setCounts] = useState({});
  const sessionId = getSessionId();

  useEffect(() => {
    if (!eventIds || eventIds.length === 0) return;
    api.get('/bora/counts', {
      params: { event_ids: eventIds.join(','), session_id: sessionId },
    })
      .then(r => setCounts(r.data))
      .catch(() => {});
  }, [eventIds?.join(',')]);

  const toggle = useCallback(async (eventId) => {
    // Optimistic update
    setCounts(prev => {
      const cur = prev[eventId] || { count: 0, reacted: false };
      return {
        ...prev,
        [eventId]: {
          count: cur.reacted ? cur.count - 1 : cur.count + 1,
          reacted: !cur.reacted,
        },
      };
    });
    try {
      const r = await api.post(`/bora/${eventId}`, null, {
        params: { session_id: sessionId },
      });
      setCounts(prev => ({ ...prev, [eventId]: { count: r.data.count, reacted: r.data.reacted } }));
    } catch {
      // reverte se der erro
      setCounts(prev => {
        const cur = prev[eventId] || { count: 0, reacted: false };
        return {
          ...prev,
          [eventId]: { count: cur.reacted ? cur.count - 1 : cur.count + 1, reacted: !cur.reacted },
        };
      });
    }
  }, [sessionId]);

  return { counts, toggle };
}
