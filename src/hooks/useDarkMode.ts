import { useEffect, useState } from 'react';
import { useAppPreferences } from '@/lib/appPreferences';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Mirrors the effective color scheme onto the `dark` class on <html>
 * (Tailwind `darkMode: 'class'`) — the OS preference for `theme: 'auto'`
 * (the default), or the user's own manual override otherwise (see the
 * header's ThemeSelect).
 */
export function useDarkMode() {
  const { theme } = useAppPreferences();
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const isDark = theme === 'auto' ? systemPrefersDark : theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return isDark;
}
