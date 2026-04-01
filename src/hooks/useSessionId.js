import { useMemo } from 'react';

function getOrCreateSessionId() {
  let id = localStorage.getItem('bf_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('bf_session_id', id);
  }
  return id;
}

export function useSessionId() {
  return useMemo(getOrCreateSessionId, []);
}
