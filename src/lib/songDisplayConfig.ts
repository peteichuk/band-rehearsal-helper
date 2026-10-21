import {
  getAppPreferencesSnapshot,
  getSongDisplayDefaults,
  setSongDisplayDefaults,
  subscribeAppPreferences,
} from '@/lib/appPreferences';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationDisplayConfig {
  fontSize: number;
  columnClass: string;
}

type PartialOrientationConfig = Partial<OrientationDisplayConfig>;
type Defaults = Record<Orientation, OrientationDisplayConfig>;
// songName -> orientation -> whichever fields this song overrides
type Overrides = Record<string, Partial<Record<Orientation, PartialOrientationConfig>>>;

const OVERRIDES_STORAGE_KEY = 'songDisplayOverrides';

export const BASE_DISPLAY_CONFIG: OrientationDisplayConfig = {
  fontSize: 16,
  columnClass: 'col-auto',
};

const BASE_DEFAULTS: Defaults = {
  portrait: { ...BASE_DISPLAY_CONFIG },
  landscape: { ...BASE_DISPLAY_CONFIG },
};

type Listener = () => void;

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

// The global per-orientation defaults now actually live in appPreferences.ts
// (folded in alongside catalogViewMode/songFormTextFontSize/theme — all
// small, low-volume UI preferences kept in one key). `defaults` here just
// mirrors that store's current value, kept fresh by the subscription below.
let defaults = getSongDisplayDefaults();
let overrides = loadOverrides();
// useSyncExternalStore compares snapshots by reference (Object.is) — this
// must only get a new identity when defaults/overrides actually change, or
// every render sees "a change" and re-renders forever.
let snapshot = { defaults, overrides };
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

// Safety net for `defaults` getting written some other way than through
// setGlobalFontSize/setGlobalColumnClass/persistDefaults below (e.g. a
// future Settings → Backup import touching appPreferences directly). The
// reference check skips the redundant update+notify for the *normal* path
// below, which already does both itself before this subscription even
// fires.
subscribeAppPreferences(() => {
  const next = getAppPreferencesSnapshot().songDisplayDefaults;
  if (next === defaults) return;
  defaults = next;
  snapshot = { defaults, overrides };
  notify();
});

function persistDefaults() {
  setSongDisplayDefaults(defaults);
  snapshot = { defaults, overrides };
  notify();
}

function persistOverrides() {
  try {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  snapshot = { defaults, overrides };
  notify();
}

/** Global default (Settings → Appearance), per device orientation — applies to any song with no override. */
export function getGlobalDefault(orientation: Orientation): OrientationDisplayConfig {
  return defaults[orientation];
}

export function setGlobalFontSize(orientation: Orientation, fontSize: number) {
  defaults = { ...defaults, [orientation]: { ...defaults[orientation], fontSize } };
  persistDefaults();
}

export function setGlobalColumnClass(orientation: Orientation, columnClass: string) {
  defaults = { ...defaults, [orientation]: { ...defaults[orientation], columnClass } };
  persistDefaults();
}

/**
 * Adjusting font/columns from a song's own page is a per-song, per-orientation
 * override on top of the global default — e.g. bumping the size for one
 * long-lined song doesn't touch anything else. Only the field actually
 * touched is recorded, so e.g. a font-size override never masks the global
 * column default for that same song.
 */
export function setSongFontSize(songName: string, orientation: Orientation, fontSize: number) {
  const song = overrides[songName] ?? {};
  overrides = {
    ...overrides,
    [songName]: { ...song, [orientation]: { ...song[orientation], fontSize } },
  };
  persistOverrides();
}

export function setSongColumnClass(
  songName: string,
  orientation: Orientation,
  columnClass: string
) {
  const song = overrides[songName] ?? {};
  overrides = {
    ...overrides,
    [songName]: { ...song, [orientation]: { ...song[orientation], columnClass } },
  };
  persistOverrides();
}

/** The override a song has for this orientation, if any — fields not customized are left out. */
export function getSongOverride(
  songName: string,
  orientation: Orientation
): PartialOrientationConfig {
  return overrides[songName]?.[orientation] ?? {};
}

/** What actually renders: the song's own override for anything it customized, global default otherwise. */
export function getEffectiveConfig(
  songName: string,
  orientation: Orientation
): OrientationDisplayConfig {
  const base = defaults[orientation];
  const override = overrides[songName]?.[orientation];
  return {
    fontSize: override?.fontSize ?? base.fontSize,
    columnClass: override?.columnClass ?? base.columnClass,
  };
}

export function getOverrideSongCount(): number {
  return Object.keys(overrides).length;
}

export function resetSongDisplayOverrides() {
  overrides = {};
  persistOverrides();
}

export function resetGlobalDisplayDefaults() {
  defaults = { ...BASE_DEFAULTS };
  persistDefaults();
}

export function getAllGlobalDefaults(): Defaults {
  return defaults;
}

/** Bulk import — a whole-orientation replace (there's only ever one global default per orientation, nothing to merge). */
export function mergeGlobalDefaults(incoming: Partial<Defaults>) {
  defaults = {
    portrait: { ...defaults.portrait, ...incoming.portrait },
    landscape: { ...defaults.landscape, ...incoming.landscape },
  };
  persistDefaults();
}

export function subscribeSongDisplayConfig(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cached snapshot object for useSyncExternalStore — a stable reference until the next actual change. */
export function getSongDisplayConfigSnapshot() {
  return snapshot;
}
