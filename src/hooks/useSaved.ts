import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useSaved(isLoggedIn: boolean) {
  const [savedIds, setSavedIds] = useState(new Set<number>());

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/saved').then(r => setSavedIds(new Set(r.data.map((e: { id: number }) => e.id)))).catch(() => {});
  }, [isLoggedIn]);

  const toggle = useCallback(async (eventId: number) => {
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
