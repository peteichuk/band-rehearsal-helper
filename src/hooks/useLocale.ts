import { useEffect } from 'react';
import i18n from '@/lib/i18n';
import { useAppPreferences } from '@/lib/appPreferences';
import { resolveEffectiveLocale } from '@/lib/locale';

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
    void i18n.changeLanguage(effectiveLocale);
    document.documentElement.lang = effectiveLocale;
  }, [effectiveLocale]);

  return effectiveLocale;
}
