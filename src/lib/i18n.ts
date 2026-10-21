import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getAppPreferencesSnapshot } from '@/lib/appPreferences';
import { resolveEffectiveLocale, type Locale } from '@/lib/locale';

/**
 * English isn't a translation file — the JSX itself holds the English text,
 * used directly as the lookup key (see useLocale.ts / any `t('...')` call).
 * Every other locale is lazy-loaded on demand (see loadLocale below) rather
 * than bundled upfront, so a visitor only ever downloads the one language
 * they actually use — never the other seven.
 */
void i18n.use(initReactI18next).init({
  resources: {},
  lng: resolveEffectiveLocale(getAppPreferencesSnapshot().locale),
  fallbackLng: 'en',
  // Keys are full English sentences, which routinely contain "." and ":" —
  // without disabling these, i18next would try to parse them as
  // namespace/nested-key separators instead of treating them as flat text.
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }, // React already escapes on render
});

// One dynamic import() per locale, so Vite code-splits each into its own
// chunk (see vite.config.ts's manualChunks — named `locale-<code>` so the
// service worker's runtimeCaching rule can recognize and lazily cache them,
// separate from the rest of the precached app shell).
const localeLoaders: Record<Exclude<Locale, 'en'>, () => Promise<{ default: object }>> = {
  uk: () => import('@/locales/uk.json'),
  pl: () => import('@/locales/pl.json'),
  ja: () => import('@/locales/ja.json'),
  es: () => import('@/locales/es.json'),
  pt: () => import('@/locales/pt.json'),
  hi: () => import('@/locales/hi.json'),
  bn: () => import('@/locales/bn.json'),
};

const loadedLocales = new Set<Locale>(['en']); // 'en' has no bundle to load — the keys already are English

/**
 * Fetches (once) and registers a locale's translation bundle. Safe to call
 * repeatedly for the same locale — later calls resolve immediately once
 * it's already loaded. Doesn't itself switch the active language; pair with
 * `i18n.changeLanguage()` (see useLocale.ts).
 */
export async function loadLocale(locale: Locale): Promise<void> {
  if (loadedLocales.has(locale)) return;
  const load = localeLoaders[locale as Exclude<Locale, 'en'>];
  if (!load) return;
  const module = await load();
  i18n.addResourceBundle(locale, 'translation', module.default);
  loadedLocales.add(locale);
}

export function isLocaleLoaded(locale: Locale): boolean {
  return loadedLocales.has(locale);
}

export default i18n;
