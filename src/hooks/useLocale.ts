import { useEffect, useSyncExternalStore } from 'react';
import i18n, { loadLocale } from '@/lib/i18n';
import { useAppPreferences } from '@/lib/appPreferences';
import { resolveEffectiveLocale } from '@/lib/locale';

// Whether a locale switch is currently in flight (fetching+registering its
// chunk, see i18n.ts) — exposed so the two UI entry points that trigger a
// switch (SettingsLanguageSection, LocalePromptModal) can show a small
// loading state instead of looking frozen for the one network round trip.
let isLoading = false;
const listeners = new Set<() => void>();

function setLoading(next: boolean) {
  if (next === isLoading) return;
  isLoading = next;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return isLoading;
}

export function useIsLocaleLoading(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Mirrors useDarkMode's theme/'auto' pattern for language: 'auto' (the
 * default) follows the browser/OS language, the user's own pick overrides
 * it otherwise. Unlike useDarkMode there's no live-change listener to set up
 * here — `navigator.language` doesn't fire a change event, so re-resolving
 * only needs to happen when the stored preference itself changes.
 */
export function useLocale() {
  const { locale } = useAppPreferences();
  const effectiveLocale = resolveEffectiveLocale(locale);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await loadLocale(effectiveLocale);
      if (cancelled) return;
      await i18n.changeLanguage(effectiveLocale);
      document.documentElement.lang = effectiveLocale;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveLocale]);

  return effectiveLocale;
}
