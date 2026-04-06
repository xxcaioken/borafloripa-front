import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useSessionId } from './useSessionId';

export function useBora(eventIds: number[]) {
  const [counts, setCounts] = useState<Record<number, { count: number; reacted: boolean }>>({});
  const sessionId = useSessionId();

  useEffect(() => {
    if (!eventIds || eventIds.length === 0) return;
    api.get('/bora/counts', {
      params: { event_ids: eventIds.join(','), session_id: sessionId },
    })
      .then(r => setCounts(r.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIds?.join(','), sessionId]);

  const toggle = useCallback(async (eventId: number) => {
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
