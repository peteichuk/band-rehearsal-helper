import { useEffect, useState } from 'react';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Mirrors the OS color-scheme preference onto the `dark` class on <html> (Tailwind `darkMode: 'class'`). */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setIsDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return isDark;
}
