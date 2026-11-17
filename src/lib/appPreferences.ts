import { useSyncExternalStore } from 'react';
import type { CatalogViewMode } from '@/types/pageActions';
import type { Orientation, OrientationDisplayConfig } from '@/lib/songDisplayConfig';
import type { ChordNotation } from '@/lib/chords/transpose';
import type { ChordDiagramSetting } from '@/lib/chords/chordDiagrams';
import type { ClickSoundId } from '@/components/metronome/sounds';

export type FlashIntensity = 'low' | 'normal' | 'high';
export type ThemePreference = 'light' | 'dark' | 'auto';
export type LocalePreference = 'auto' | 'en' | 'uk' | 'pl' | 'ja' | 'es' | 'pt' | 'hi' | 'bn';

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
  /** Which instrument a tapped chord is drawn for — 'off' turns tap-to-open (and the strip) off. */
  chordDiagramInstrument: ChordDiagramSetting;
  /** Whether every chord used in the song is also listed, as diagrams, below it. */
  chordStripVisible: boolean;
  /** Whether a small diagram is always drawn right next to every chord in the text. */
  chordDiagramInline: boolean;
  /** Size of every chord diagram (popover, strip, inline), in percent of the default. */
  chordDiagramScale: number;
  /** Beat flash (screen-edge glow) while the metronome plays. */
  metronomeVisualFlash: boolean;
  /** How strong the screen-edge flash looks (brightness and thickness). */
  metronomeFlashIntensity: FlashIntensity;
  /** Tempo for songs whose sheet row has no BPM. */
  metronomeDefaultBpm: number;
  /** Click sound for any song without a saved preset — also tracks whatever was picked last. */
  metronomeSoundId: ClickSoundId;
  /** Time signature for songs whose sheet row has none (or one the metronome doesn't know). */
  metronomeDefaultTimeSignatureId: string;
  /** Show songs without their lyric lines (chords only) / without their chord lines (lyrics only). */
  hideTextLine: boolean;
  hideChordLine: boolean;
  /** How the note B is spelled in displayed chords — see ChordNotation. */
  chordNotation: ChordNotation;
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
  chordDiagramInstrument: 'guitar',
  chordStripVisible: false,
  chordDiagramInline: false,
  chordDiagramScale: 100,
  metronomeVisualFlash: true,
  metronomeFlashIntensity: 'normal',
  metronomeDefaultBpm: 120,
  metronomeSoundId: 'tick',
  metronomeDefaultTimeSignatureId: '4-4',
  hideTextLine: false,
  hideChordLine: false,
  chordNotation: 'american',
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

/**
 * Fields that used to live under their own standalone localStorage keys
 * (written through useLocalStorageState) before being folded into this
 * store. Runs on every load, but only ever acts for a field the stored
 * object doesn't have yet — i.e. once per field per device — then drops the
 * old key, so it can never resurrect a stale value over a newer one.
 */
const LEGACY_FIELD_KEYS: [keyof AppPreferences, string][] = [
  ['metronomeVisualFlash', 'metronome-visual-flash'],
  ['metronomeSoundId', 'metronome-sound'],
  ['hideTextLine', 'hideTextLine'],
  ['hideChordLine', 'hideChordLine'],
];

function migrateLegacyFields(stored: Partial<AppPreferences>): Partial<AppPreferences> {
  const next: Record<string, unknown> = { ...stored };
  for (const [field, legacyKey] of LEGACY_FIELD_KEYS) {
    try {
      const raw = localStorage.getItem(legacyKey);
      if (raw !== null && !(field in next)) next[field] = JSON.parse(raw);
      localStorage.removeItem(legacyKey);
    } catch {
      // A value that won't parse just falls back to the field's default.
    }
  }
  return next as Partial<AppPreferences>;
}

function loadFromStorage(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = migrateLegacyFields(JSON.parse(raw) as Partial<AppPreferences>);
      return { ...DEFAULT_PREFERENCES, ...stored };
    }
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
  const migrated = migrateFromLegacyKeys();
  return { ...migrated, ...migrateLegacyFields({}) };
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

export function setChordDiagramInstrument(chordDiagramInstrument: ChordDiagramSetting) {
  update({ chordDiagramInstrument });
}

export function setChordStripVisible(chordStripVisible: boolean) {
  update({ chordStripVisible });
}

export function setChordDiagramInline(chordDiagramInline: boolean) {
  update({ chordDiagramInline });
}

export function setChordDiagramScale(chordDiagramScale: number) {
  update({ chordDiagramScale });
}

export function setMetronomeVisualFlash(metronomeVisualFlash: boolean) {
  update({ metronomeVisualFlash });
}

export function setMetronomeFlashIntensity(metronomeFlashIntensity: FlashIntensity) {
  update({ metronomeFlashIntensity });
}

export function setMetronomeDefaultBpm(metronomeDefaultBpm: number) {
  update({ metronomeDefaultBpm });
}

export function setMetronomeSoundId(metronomeSoundId: ClickSoundId) {
  update({ metronomeSoundId });
}

export function setMetronomeDefaultTimeSignatureId(metronomeDefaultTimeSignatureId: string) {
  update({ metronomeDefaultTimeSignatureId });
}

export function setHideTextLine(hideTextLine: boolean) {
  update({ hideTextLine });
}

export function setChordNotation(chordNotation: ChordNotation) {
  update({ chordNotation });
}

export function setHideChordLine(hideChordLine: boolean) {
  update({ hideChordLine });
}

/** The app preferences that travel in a Settings → Backup file — device-specific ones (theme, language, catalog view) deliberately stay out. */
export type BackupAppPreferences = Pick<
  AppPreferences,
  | 'chordDiagramInstrument'
  | 'chordStripVisible'
  | 'chordDiagramInline'
  | 'chordDiagramScale'
  | 'metronomeVisualFlash'
  | 'metronomeFlashIntensity'
  | 'metronomeDefaultBpm'
  | 'metronomeSoundId'
  | 'metronomeDefaultTimeSignatureId'
  | 'hideTextLine'
  | 'hideChordLine'
  | 'chordNotation'
>;

export function getBackupAppPreferences(): BackupAppPreferences {
  const p = preferences;
  return {
    chordDiagramInstrument: p.chordDiagramInstrument,
    chordStripVisible: p.chordStripVisible,
    chordDiagramInline: p.chordDiagramInline,
    chordDiagramScale: p.chordDiagramScale,
    metronomeVisualFlash: p.metronomeVisualFlash,
    metronomeFlashIntensity: p.metronomeFlashIntensity,
    metronomeDefaultBpm: p.metronomeDefaultBpm,
    metronomeSoundId: p.metronomeSoundId,
    metronomeDefaultTimeSignatureId: p.metronomeDefaultTimeSignatureId,
    hideTextLine: p.hideTextLine,
    hideChordLine: p.hideChordLine,
    chordNotation: p.chordNotation,
  };
}

/** Applies an imported backup's preferences, keeping only fields of the right type — a hand-edited or older file can't poison the store. */
export function applyBackupAppPreferences(incoming: Partial<BackupAppPreferences>) {
  const patch: Partial<AppPreferences> = {};
  const bool = (v: unknown): v is boolean => typeof v === 'boolean';
  const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
  if (['off', 'guitar', 'ukulele', 'piano'].includes(incoming.chordDiagramInstrument as string)) {
    patch.chordDiagramInstrument = incoming.chordDiagramInstrument;
  }
  if (bool(incoming.chordStripVisible)) patch.chordStripVisible = incoming.chordStripVisible;
  if (bool(incoming.chordDiagramInline)) patch.chordDiagramInline = incoming.chordDiagramInline;
  if (typeof incoming.chordDiagramScale === 'number' && incoming.chordDiagramScale > 0) {
    patch.chordDiagramScale = incoming.chordDiagramScale;
  }
  if (bool(incoming.metronomeVisualFlash))
    patch.metronomeVisualFlash = incoming.metronomeVisualFlash;
  if (['low', 'normal', 'high'].includes(incoming.metronomeFlashIntensity as string)) {
    patch.metronomeFlashIntensity = incoming.metronomeFlashIntensity;
  }
  if (
    typeof incoming.metronomeDefaultBpm === 'number' &&
    incoming.metronomeDefaultBpm >= 20 &&
    incoming.metronomeDefaultBpm <= 280
  ) {
    patch.metronomeDefaultBpm = Math.round(incoming.metronomeDefaultBpm);
  }
  if (str(incoming.metronomeSoundId)) patch.metronomeSoundId = incoming.metronomeSoundId;
  if (str(incoming.metronomeDefaultTimeSignatureId)) {
    patch.metronomeDefaultTimeSignatureId = incoming.metronomeDefaultTimeSignatureId;
  }
  if (bool(incoming.hideTextLine)) patch.hideTextLine = incoming.hideTextLine;
  if (bool(incoming.hideChordLine)) patch.hideChordLine = incoming.hideChordLine;
  if (incoming.chordNotation === 'american' || incoming.chordNotation === 'german') {
    patch.chordNotation = incoming.chordNotation;
  }
  update(patch);
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
