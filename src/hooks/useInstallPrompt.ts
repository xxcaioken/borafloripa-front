import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem('bf_pwa_dismissed'));

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
  }

  function dismiss() {
    localStorage.setItem('bf_pwa_dismissed', '1');
    setDismissed(true);
    setPrompt(null);
  }

  const show = !!prompt && !dismissed;
  return { show, install, dismiss };
}
