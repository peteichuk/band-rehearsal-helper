import { useSyncExternalStore } from 'react';
import type { CatalogViewMode } from '@/types/pageActions';
import type { Orientation, OrientationDisplayConfig } from '@/lib/songDisplayConfig';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type LocalePreference = 'auto' | 'en' | 'uk' | 'pl';

/**
 * Small, low-volume "how does the UI look" preferences, kept in one key
 * rather than one localStorage key each — unlike the per-song content
 * stores (favorites, groups, setlists, metronome presets, …), which stay
 * separate on purpose (see the MetronomePreset interface comment in
 * metronomePresets.ts for that reasoning).
 */
export interface AppPreferences {
  catalogViewMode: CatalogViewMode;
  songFormTextFontSize: number;
  songDisplayDefaults: Record<Orientation, OrientationDisplayConfig>;
  theme: ThemePreference;
  locale: LocalePreference;
  /** Whether the first-run "pick your language" prompt has been shown/dismissed once. */
  localePromptSeen: boolean;
}

const STORAGE_KEY = 'appPreferences';
const BASE_DISPLAY_CONFIG: OrientationDisplayConfig = { fontSize: 16, columnClass: 'col-auto' };

const DEFAULT_PREFERENCES: AppPreferences = {
  catalogViewMode: 'library',
  songFormTextFontSize: 16,
  songDisplayDefaults: {
    portrait: { ...BASE_DISPLAY_CONFIG },
    landscape: { ...BASE_DISPLAY_CONFIG },
  },
  theme: 'auto',
  locale: 'auto',
  localePromptSeen: false,
};

type Listener = () => void;

/**
 * One-time migration from the 3 separate keys this store replaces, plus
 * cleanup of `songContentFontSize` (a dead key from an older version of the
 * app — nothing in the codebase reads it any more). Only ever runs once:
 * by the time it returns, `STORAGE_KEY` is written, so every later
 * `loadFromStorage()` call (e.g. a page reload) reads the combined key
 * directly and never reaches this again.
 */
function migrateFromLegacyKeys(): AppPreferences {
  const next = { ...DEFAULT_PREFERENCES };
  try {
    const rawView = localStorage.getItem('catalogViewMode');
    if (rawView) {
      // Same pre-rename literals App.tsx used to normalize inline.
      const parsed = JSON.parse(rawView) as unknown;
      next.catalogViewMode =
        parsed === 'list'
          ? 'library'
          : parsed === 'albums'
            ? 'setlists'
            : (parsed as CatalogViewMode);
    }
    const rawFontSize = localStorage.getItem('songFormTextFontSize');
    if (rawFontSize) next.songFormTextFontSize = JSON.parse(rawFontSize) as number;
    const rawDefaults = localStorage.getItem('songDisplayDefaults');
    if (rawDefaults) {
      const parsed = JSON.parse(rawDefaults) as Partial<
        Record<Orientation, OrientationDisplayConfig>
      >;
      next.songDisplayDefaults = {
        portrait: { ...BASE_DISPLAY_CONFIG, ...parsed.portrait },
        landscape: { ...BASE_DISPLAY_CONFIG, ...parsed.landscape },
      };
    }
  } catch {
    // Any single key failing to parse just leaves that field at its default.
  }
  localStorage.removeItem('catalogViewMode');
  localStorage.removeItem('songFormTextFontSize');
  localStorage.removeItem('songDisplayDefaults');
  localStorage.removeItem('songContentFontSize');
  return next;
}

function loadFromStorage(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<AppPreferences>) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
  return migrateFromLegacyKeys();
}

let preferences = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

// Migration runs at module init (above) but only reads/removes the legacy
// keys — it doesn't write STORAGE_KEY itself, so a fresh install's very
// first read wouldn't yet have it on disk. Persisting once here (a no-op
// write when nothing migrated, since preferences already equals the
// defaults) guarantees STORAGE_KEY exists after the very first load.
persist();

function update(patch: Partial<AppPreferences>) {
  preferences = { ...preferences, ...patch };
  persist();
}

export function setCatalogViewMode(catalogViewMode: CatalogViewMode) {
  update({ catalogViewMode });
}

export function setSongFormTextFontSize(songFormTextFontSize: number) {
  update({ songFormTextFontSize });
}

export function getSongDisplayDefaults(): Record<Orientation, OrientationDisplayConfig> {
  return preferences.songDisplayDefaults;
}

export function setSongDisplayDefaults(
  songDisplayDefaults: Record<Orientation, OrientationDisplayConfig>
) {
  update({ songDisplayDefaults });
}

export function setTheme(theme: ThemePreference) {
  update({ theme });
}

export function setLocale(locale: LocalePreference) {
  update({ locale });
}

export function setLocalePromptSeen(localePromptSeen: boolean) {
  update({ localePromptSeen });
}

export function subscribeAppPreferences(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppPreferencesSnapshot(): AppPreferences {
  return preferences;
}

export function useAppPreferences(): AppPreferences {
  return useSyncExternalStore(subscribeAppPreferences, getAppPreferencesSnapshot);
}
