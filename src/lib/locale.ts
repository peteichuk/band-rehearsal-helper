import type { LocalePreference } from '@/lib/appPreferences';

export const SUPPORTED_LOCALES = ['en', 'uk', 'pl', 'ja', 'es', 'pt', 'hi', 'bn'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Each language written in its own name — shown as-is in a picker so it
 * reads correctly before any locale is even chosen. Ordered alphabetically
 * by English language name (the usual convention for a flat language list),
 * not grouped by script/region.
 */
export interface LocaleOption {
  value: Locale;
  flag: string;
  code: string;
  label: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'bn', flag: '🇧🇩', code: 'BN', label: 'বাংলা' },
  { value: 'en', flag: '🇺🇸', code: 'EN', label: 'English' },
  { value: 'hi', flag: '🇮🇳', code: 'HI', label: 'हिन्दी' },
  { value: 'ja', flag: '🇯🇵', code: 'JA', label: '日本語' },
  { value: 'pl', flag: '🇵🇱', code: 'PL', label: 'Polski' },
  { value: 'pt', flag: '🇧🇷', code: 'PT', label: 'Português (Brasil)' },
  { value: 'es', flag: '🇪🇸', code: 'ES', label: 'Español' },
  { value: 'uk', flag: '🇺🇦', code: 'UK', label: 'Українська' },
];

function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// Close enough to Ukrainian (mutually intelligible, former/current exposure)
// that a user with one of these as their system language is better served by
// defaulting to Ukrainian than to English.
const NEAR_UKRAINIAN_LOCALES = ['ru', 'be'];

/** `navigator.language` is e.g. "uk-UA" — only the primary subtag matters for matching. */
export function resolveSystemLocale(): Locale {
  const primary = window.navigator.language?.split('-')[0];
  if (primary && isSupportedLocale(primary)) return primary;
  if (primary && NEAR_UKRAINIAN_LOCALES.includes(primary)) return 'uk';
  return 'en';
}

/**
 * Whether the system language is only an inferred guess rather than a direct
 * match — i.e. ru/be, defaulted to Ukrainian by resolveSystemLocale() above
 * rather than an exact hit. A directly-supported system language (uk, en,
 * pl, …) needs no confirmation; a guess does, so the first-run prompt
 * (LocalePromptModal) only shows up for this case.
 */
export function isAmbiguousSystemLocale(): boolean {
  const primary = window.navigator.language?.split('-')[0];
  return Boolean(primary && NEAR_UKRAINIAN_LOCALES.includes(primary));
}

/** 'auto' follows the OS/browser language; anything else is the user's explicit override. */
export function resolveEffectiveLocale(preference: LocalePreference): Locale {
  return preference === 'auto' ? resolveSystemLocale() : preference;
}
