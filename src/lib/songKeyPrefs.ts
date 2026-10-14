const STORAGE_KEY = 'songTonalityPrefs';

type Listener = () => void;
type Store = Record<string, string>; // songName -> last chosen tonality name

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
 * Lets a song be reopened in whatever tonality was last picked for it —
 * handy for a capo player who always wants the same key for a given song.
 * Capo isn't stored separately: the capo select always derives from how
 * many semitones the chosen tonality sits above the song's original key.
 */
export function getSongTonalityPref(songName: string): string | null {
  return store[songName] ?? null;
}

export function setSongTonalityPref(songName: string, tonalityName: string) {
  store = { ...store, [songName]: tonalityName };
  persist();
}

/** Drops a song's saved pref entirely — used when it's set back to its original key/no capo. */
export function deleteSongTonalityPref(songName: string) {
  if (!(songName in store)) return;
  const next = { ...store };
  delete next[songName];
  store = next;
  persist();
}

export function resetSongTonalityPrefs() {
  store = {};
  persist();
}

export function subscribeSongTonalityPrefs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSongTonalityPrefsSnapshot(): Store {
  return store;
}

export function getAllSongTonalityPrefs(): Store {
  return store;
}

/** Bulk import — merges, so an imported file never drops prefs already set locally. */
export function mergeSongTonalityPrefs(incoming: Store) {
  store = { ...store, ...incoming };
  persist();
}

/**
 * Builds the query params for navigating TO `songName`: always strips
 * whatever tonality was in the URL for the song being left, then — and only
 * then — re-adds it if this specific song has its own saved pref. This is
 * the one place that ever puts ?tonality= on a navigation; nothing else
 * should, or it ends up sticking to songs that never had it.
 */
export function applySongTonalityToParams(
  params: URLSearchParams,
  songName: string
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete('tonality');
  const pref = getSongTonalityPref(songName);
  if (pref) next.set('tonality', pref);
  return next;
}
