'use client';
import { useEffect } from 'react';
import { settingsStorage } from '../../lib/localStorage';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const settings = settingsStorage.get();
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, []);
  return <>{children}</>;
}
