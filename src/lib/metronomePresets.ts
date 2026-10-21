import type { BeatLevel } from '@/components/metronome/timeSignatures';
import type { ClickSoundId } from '@/components/metronome/sounds';
import { deepMerge } from '@/lib/deepMerge';

/**
 * Everything a song's metronome can remember about itself, all optional —
 * only ever written field-by-field (see `setMetronomePreset`), so a song
 * can have just a tempo saved and nothing else.
 *
 * Adding a new field here that should behave like `bpm`/`timeSignatureId`/
 * `accentPatternId`/`customAccentPatterns` (saved per song, falls back to
 * some per-song default when unset, and should live-update an already-open
 * LocalMetronomePanel when changed from outside it — e.g. a settings
 * Import) only needs one more line in `resolveSyncedPresetFields` below —
 * that's the single place both the "did this change externally" check and
 * the "apply it" step in LocalMetronomePanel read from, so nothing can
 * silently fall out of sync again. `soundId` is the one exception: it
 * doesn't have a per-song sheet default to fall back to, so it keeps its
 * own separate global-rolling-default handling in LocalMetronomePanel
 * instead of going through `resolveSyncedPresetFields`.
 */
export interface MetronomePreset {
  /** Overrides the song's own `BPM` sheet column. */
  bpm?: number;
  /** Overrides the song's own `TimeSignature` sheet column (see timeSignatures.ts) — an internal id like "4-4", "7-8", never the sheet's raw "4/4" label. */
  timeSignatureId?: string;
  /** One of the current time signature's own `AccentPattern` ids (see timeSignatures.ts) — 'off', 'on', a grouping like "3-3-2", or CUSTOM_PATTERN_ID. */
  accentPatternId?: string;
  /** The user's own per-beat levels for the Custom accent pattern, keyed by timeSignatureId. */
  customAccentPatterns?: Record<string, BeatLevel[]>;
  /** Which click sound to play — the one field here with no per-song sheet default (see the class comment above). */
  soundId?: ClickSoundId;
}

/**
 * The subset of `MetronomePreset` that's kept in sync with an already-open
 * LocalMetronomePanel (everything except `soundId` — see the interface
 * comment above). `bpm`/`timeSignatureId` are always resolved to a concrete
 * value (the song's own sheet default when the preset doesn't override
 * them); `customAccentPatterns` always resolved to `{}` rather than
 * `undefined`, since callers key straight into it without an `?? {}` of
 * their own.
 */
export interface SyncedPresetFields {
  bpm: number;
  timeSignatureId: string;
  accentPatternId?: string;
  customAccentPatterns: Record<string, BeatLevel[]>;
}

/**
 * Resolves the synced fields a LocalMetronomePanel should actually show,
 * given the song's saved preset (if any) and the per-song defaults that
 * apply when the preset doesn't override a given field. The one place that
 * enumerates "which fields sync this way" — see the `MetronomePreset`
 * interface comment for why new fields belong here.
 */
export function resolveSyncedPresetFields(
  preset: MetronomePreset | null | undefined,
  sheetDefaults: { bpm: number; timeSignatureId: string }
): SyncedPresetFields {
  return {
    bpm: preset?.bpm ?? sheetDefaults.bpm,
    timeSignatureId: preset?.timeSignatureId ?? sheetDefaults.timeSignatureId,
    accentPatternId: preset?.accentPatternId,
    customAccentPatterns: preset?.customAccentPatterns ?? {},
  };
}

const STORAGE_KEY = 'metronomePresets';

type Listener = () => void;
type Store = Record<string, MetronomePreset>; // songName -> preset

function loadFromStorage(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

let store = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

/**
 * Lets a song's metronome (tempo, time signature, accent pattern) reopen the
 * way it was last left for THAT song specifically — kept per song rather
 * than e.g. per time signature, since a per-time-signature accent pref would
 * otherwise bleed across unrelated songs that happen to share a meter.
 */
export function getMetronomePreset(songName: string): MetronomePreset | null {
  return store[songName] ?? null;
}

/** Merges into whatever preset the song already has, so changing just the tempo doesn't drop its saved accent pattern. */
export function setMetronomePreset(songName: string, patch: MetronomePreset) {
  store = { ...store, [songName]: { ...store[songName], ...patch } };
  persist();
}

/** Drops a single song's preset (e.g. "remove from cache" in Settings). */
export function deleteMetronomePreset(songName: string) {
  if (!(songName in store)) return;
  const next = { ...store };
  delete next[songName];
  store = next;
  persist();
}

export function resetMetronomePresets() {
  store = {};
  persist();
}

export function subscribeMetronomePresets(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMetronomePresetsSnapshot(): Store {
  return store;
}

export function getAllMetronomePresets(): Store {
  return store;
}

/**
 * Bulk import — merges per song via `deepMerge`, not a shallow
 * `{...local, ...incoming}`: a top-level field (bpm, timeSignatureId, …) an
 * imported preset has wins over what the song already had, but
 * `customAccentPatterns` recurses one level further so an imported custom
 * pattern for one time signature doesn't wipe out a different time
 * signature's custom pattern the song already had saved.
 */
export function mergeMetronomePresets(incoming: Store) {
  const next = { ...store };
  for (const [songName, preset] of Object.entries(incoming)) {
    next[songName] = deepMerge(next[songName], preset) ?? preset;
  }
  store = next;
  persist();
}
