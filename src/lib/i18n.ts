import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from '@/locales/uk.json';
import pl from '@/locales/pl.json';
import { getAppPreferencesSnapshot } from '@/lib/appPreferences';
import { resolveEffectiveLocale } from '@/lib/locale';

/**
 * English isn't a translation file — the JSX itself holds the English text,
 * used directly as the lookup key (see useLocale.ts / any `t('...')` call).
 * Only non-English locales get a resource bundle; a key missing there falls
 * back to being looked up as `fallbackLng`, which has no bundle either, so
 * i18next's default missing-key behavior kicks in: return the key itself,
 * i.e. the original English sentence.
 */
void i18n.use(initReactI18next).init({
  resources: { uk: { translation: uk }, pl: { translation: pl } },
  lng: resolveEffectiveLocale(getAppPreferencesSnapshot().locale),
  fallbackLng: 'en',
  // Keys are full English sentences, which routinely contain "." and ":" —
  // without disabling these, i18next would try to parse them as
  // namespace/nested-key separators instead of treating them as flat text.
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }, // React already escapes on render
});

export default i18n;
