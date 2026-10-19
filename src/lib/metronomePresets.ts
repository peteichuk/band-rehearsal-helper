export interface MetronomePreset {
  bpm?: number;
  timeSignatureId?: string;
  accentPatternId?: string;
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

/** Bulk import — merges per song (an imported field wins over one the song already has set locally, same as mergeSongLineNotes). */
export function mergeMetronomePresets(incoming: Store) {
  const next = { ...store };
  for (const [songName, preset] of Object.entries(incoming)) {
    next[songName] = { ...next[songName], ...preset };
  }
  store = next;
  persist();
}
