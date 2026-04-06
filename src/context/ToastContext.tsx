import React, { createContext, useContext, useCallback } from 'react';
import { notifications } from '@mantine/notifications';

interface ToastContextType {
  show: (message: string, type?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TYPE_COLOR: Record<string, string> = {
  success: 'teal',
  info:    'blue',
  error:   'red',
  warning: 'orange',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = useCallback((message: string, type = 'info', duration = 2500) => {
    notifications.show({
      message,
      color: TYPE_COLOR[type] ?? 'blue',
      autoClose: duration,
      position: 'bottom-center',
      styles: {
        root: { background: 'var(--surface2)', border: '1px solid var(--border2)' },
        description: { color: 'var(--text1)', fontSize: '14px', fontWeight: 500 },
      },
    });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext) as ToastContextType;
