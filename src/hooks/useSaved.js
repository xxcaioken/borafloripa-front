import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useSaved(isLoggedIn) {
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!isLoggedIn) { setSavedIds(new Set()); return; }
    api.get('/saved').then(r => setSavedIds(new Set(r.data.map(e => e.id)))).catch(() => {});
  }, [isLoggedIn]);

  const toggle = useCallback(async (eventId) => {
    if (!isLoggedIn) return;
    const isSaved = savedIds.has(eventId);
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(eventId) : next.add(eventId);
      return next;
    });
    try {
      isSaved
        ? await api.delete(`/saved/${eventId}`)
        : await api.post(`/saved/${eventId}`);
    } catch {
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(eventId) : next.delete(eventId);
        return next;
      });
    }
  }, [isLoggedIn, savedIds]);

  return { savedIds, toggle };
}
