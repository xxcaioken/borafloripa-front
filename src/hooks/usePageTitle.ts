import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    const base = 'Bora Floripa';
    document.title = title ? `${title} — ${base}` : base;
    return () => { document.title = base; };
  }, [title]);
}
