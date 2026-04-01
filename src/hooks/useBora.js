import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useSessionId } from './useSessionId';

export function useBora(eventIds) {
  const [counts, setCounts] = useState({});
  const sessionId = useSessionId();

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
