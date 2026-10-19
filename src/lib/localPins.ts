const STORAGE_KEY = 'localPinOverrides';

type Listener = () => void;
export type PinOverrides = Record<string, boolean>;

function loadFromStorage(): PinOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PinOverrides) : {};
  } catch {
    return {};
  }
}

let overrides = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

/**
 * Pinning is a personal "keep this at the top of my list" override on top of
 * the sheet's own `PinedByDefault` column — it only affects sort order, never
 * prev/next navigation (that's `localFavorites`, a fully separate concept).
 */
export function togglePinOverride(name: string, currentEffectiveValue: boolean) {
  overrides = { ...overrides, [name]: !currentEffectiveValue };
  persist();
}

export function getPinOverrides(): PinOverrides {
  return overrides;
}

export function setPinOverrides(next: PinOverrides) {
  overrides = next;
  persist();
}

/** Drops a single song's override (e.g. "remove from cache" in Settings), reverting just that one song to the sheet default. */
export function deletePinOverride(name: string) {
  if (!(name in overrides)) return;
  const next = { ...overrides };
  delete next[name];
  overrides = next;
  persist();
}

/** Reverts every local pin change, so effective pin state goes back to pure sheet defaults. */
export function resetPinOverrides() {
  overrides = {};
  persist();
}

export function subscribePinOverrides(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPinOverridesSnapshot(): PinOverrides {
  return overrides;
}
