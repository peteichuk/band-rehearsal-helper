const STORAGE_KEY = 'localFavorites';

type Listener = () => void;

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

let favorites = loadFavorites();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

export function toggleLocalFavorite(name: string) {
  // Build a new Set rather than mutating in place — useSyncExternalStore
  // compares snapshots by reference, so an in-place mutation wouldn't be
  // seen as a change and the UI would silently fail to re-render.
  const next = new Set(favorites);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  favorites = next;
  persist();
}

export function getLocalFavorites(): string[] {
  return Array.from(favorites);
}

export function setLocalFavorites(names: string[]) {
  favorites = new Set(names);
  persist();
}

/** Clears the curated list — with nothing starred, navigation falls back to pinned songs again. */
export function resetLocalFavorites() {
  favorites = new Set();
  persist();
}

export function subscribeLocalFavorites(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocalFavoritesSnapshot(): Set<string> {
  return favorites;
}
