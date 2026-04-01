import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useFollowVenue(isLoggedIn) {
  const [followedIds, setFollowedIds] = useState(new Set());

  useEffect(() => {
    if (!isLoggedIn) { setFollowedIds(new Set()); return; }
    api.get('/follows/venues').then(r => setFollowedIds(new Set(r.data.map(v => v.id)))).catch(() => {});
  }, [isLoggedIn]);

  const toggle = useCallback(async (venueId) => {
    if (!isLoggedIn) return;
    const isFollowed = followedIds.has(venueId);
    setFollowedIds(prev => {
      const next = new Set(prev);
      isFollowed ? next.delete(venueId) : next.add(venueId);
      return next;
    });
    try {
      isFollowed
        ? await api.delete(`/follows/venues/${venueId}`)
        : await api.post(`/follows/venues/${venueId}`);
    } catch {
      setFollowedIds(prev => {
        const next = new Set(prev);
        isFollowed ? next.add(venueId) : next.delete(venueId);
        return next;
      });
    }
  }, [isLoggedIn, followedIds]);

  return { followedIds, toggle };
}
