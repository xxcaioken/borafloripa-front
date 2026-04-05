import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications(isLoggedIn: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const fetchCount = useCallback(() => {
    if (!isLoggedIn) return;
    api.get('/notifications/unread-count')
      .then(r => setUnread(r.data.count))
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCount();
    // Poll a cada 60s para novidades
    const t = setInterval(fetchCount, 60_000);
    return () => clearInterval(t);
  }, [fetchCount]);

  const fetchAll = useCallback(() => {
    if (!isLoggedIn) return;
    api.get('/notifications')
      .then(r => { setItems(r.data); setUnread(0); })
      .catch(() => {});
  }, [isLoggedIn]);

  const markAllRead = useCallback(() => {
    api.post('/notifications/read-all').catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  return { items, unread, fetchAll, markAllRead };
}
