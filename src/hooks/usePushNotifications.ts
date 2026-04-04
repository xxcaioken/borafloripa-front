import { useState, useEffect } from 'react';
import { api } from '../services/api';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export function usePushNotifications(isLoggedIn: boolean) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ok =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  // Check if already subscribed
  useEffect(() => {
    if (!supported || !isLoggedIn) return;
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => { if (sub) setSubscribed(true); })
      .catch(() => {});
  }, [supported, isLoggedIn]);

  async function subscribe(): Promise<boolean> {
    if (!supported || !isLoggedIn || loading) return false;
    setLoading(true);
    try {
      const { data } = await api.get('/follows/vapid-key');
      if (!data.public_key) return false;  // push not configured on server

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key),
      });

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await api.post('/follows/push-subscription', {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      setSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!supported) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await sub.unsubscribe();
    await api.delete('/follows/push-subscription', {
      data: { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
    }).catch(() => {});
    setSubscribed(false);
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
