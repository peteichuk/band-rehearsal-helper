const STORAGE_KEY = 'localSetlists';
const LEGACY_STORAGE_KEY = 'localAlbums';

type Listener = () => void;

export interface SetlistSongEntry {
  songName: string;
  /** Explicit manual position (drag-drop or typed index) — sparse, see sortSetlistSongs. */
  customIndex?: number;
}

export interface Setlist {
  id: string;
  name: string;
  createdAt: number;
  songs: SetlistSongEntry[];
}

export type LocalSetlists = Record<string, Setlist>; // setlist id -> Setlist

function loadFromStorage(): LocalSetlists {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocalSetlists;

    // One-time migration from the pre-rename key — copy forward under the
    // new name, but leave the legacy key in place rather than delete it.
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as LocalSetlists;
      localStorage.setItem(STORAGE_KEY, legacyRaw);
      return legacy;
    }
    return {};
  } catch {
    return {};
  }
}

let setlists = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setlists));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `setlist-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createSetlist(name: string): Setlist {
  const clean = name.replace(/[\r\n]+/g, ' ').trim();
  const setlist: Setlist = {
    id: generateId(),
    name: clean || 'Untitled setlist',
    createdAt: Date.now(),
    songs: [],
  };
  setlists = { ...setlists, [setlist.id]: setlist };
  persist();
  return setlist;
}

export function renameSetlist(setlistId: string, name: string) {
  const setlist = setlists[setlistId];
  if (!setlist) return;
  const clean = name.replace(/[\r\n]+/g, ' ').trim();
  if (!clean) return;
  setlists = { ...setlists, [setlistId]: { ...setlist, name: clean } };
  persist();
}

export function deleteSetlist(setlistId: string) {
  if (!setlists[setlistId]) return;
  const next = { ...setlists };
  delete next[setlistId];
  setlists = next;
  persist();
}

/**
 * Appends at the very end of the setlist's current display order. Simply
 * pushing an unindexed entry isn't enough — sortSetlistSongs sorts entries
 * with no customIndex alphabetically, so the new song would land wherever
 * its name falls, not at the bottom. Freezing the current order (same
 * tiering sortSetlistSongs uses: manually-positioned first, then
 * alphabetical) as explicit sequential indices — same trick
 * reorderSetlistSongs uses — guarantees the newly appended song is last.
 */
export function addSongToSetlist(setlistId: string, songName: string) {
  const setlist = setlists[setlistId];
  if (!setlist) return;
  if (setlist.songs.some(entry => entry.songName === songName)) return;

  const withIndex = setlist.songs.filter(entry => entry.customIndex != null);
  const withoutIndex = setlist.songs.filter(entry => entry.customIndex == null);
  withIndex.sort((a, b) => Number(a.customIndex) - Number(b.customIndex));
  withoutIndex.sort((a, b) => a.songName.localeCompare(b.songName));
  const frozenOrder = [...withIndex, ...withoutIndex].map(entry => entry.songName);
  frozenOrder.push(songName);

  const nextSongs: SetlistSongEntry[] = frozenOrder.map((name, index) => ({
    songName: name,
    customIndex: index,
  }));

  setlists = {
    ...setlists,
    [setlistId]: { ...setlist, songs: nextSongs },
  };
  persist();
}

export function removeSongFromSetlist(setlistId: string, songName: string) {
  const setlist = setlists[setlistId];
  if (!setlist) return;
  setlists = {
    ...setlists,
    [setlistId]: { ...setlist, songs: setlist.songs.filter(entry => entry.songName !== songName) },
  };
  persist();
}

/** Sparse — sets just this song's position, leaves every other entry untouched. Pass null to clear. */
export function setSongCustomIndex(setlistId: string, songName: string, index: number | null) {
  const setlist = setlists[setlistId];
  if (!setlist) return;
  const nextSongs = setlist.songs.map(entry =>
    entry.songName === songName
      ? { ...entry, customIndex: index == null ? undefined : index }
      : entry
  );
  setlists = { ...setlists, [setlistId]: { ...setlist, songs: nextSongs } };
  persist();
}

/** Drag-drop commit — locks in the exact visual order as sequential custom indices for everyone. */
export function reorderSetlistSongs(setlistId: string, orderedSongNames: string[]) {
  const setlist = setlists[setlistId];
  if (!setlist) return;
  const byName = new Map(setlist.songs.map(entry => [entry.songName, entry]));
  const nextSongs = orderedSongNames.map((songName, index) => ({
    ...(byName.get(songName) ?? { songName }),
    customIndex: index,
  }));
  setlists = { ...setlists, [setlistId]: { ...setlist, songs: nextSongs } };
  persist();
}

/** Case-insensitive — used to detect a naming conflict when importing a shared setlist. */
export function findSetlistByName(name: string): Setlist | undefined {
  const target = name.trim().toLowerCase();
  return Object.values(setlists).find(setlist => setlist.name.trim().toLowerCase() === target);
}

/**
 * Creates a setlist from imported data, or — given `replaceId` — overwrites
 * an existing one in place (keeps its id, so it stays the same setlist rather
 * than leaving a duplicate behind).
 */
export function importSetlist(
  name: string,
  songs: SetlistSongEntry[],
  replaceId?: string
): Setlist {
  const clean = name.replace(/[\r\n]+/g, ' ').trim() || 'Untitled setlist';

  if (replaceId && setlists[replaceId]) {
    const setlist: Setlist = { ...setlists[replaceId], name: clean, songs };
    setlists = { ...setlists, [replaceId]: setlist };
    persist();
    return setlist;
  }

  const setlist: Setlist = { id: generateId(), name: clean, createdAt: Date.now(), songs };
  setlists = { ...setlists, [setlist.id]: setlist };
  persist();
  return setlist;
}

export function getSetlistsForSong(songName: string): Setlist[] {
  return Object.values(setlists).filter(setlist =>
    setlist.songs.some(entry => entry.songName === songName)
  );
}

export function getAllSetlists(): Setlist[] {
  return Object.values(setlists);
}

/**
 * Bulk import (Settings → Backup) — unlike the single-setlist import flow,
 * this never prompts per setlist: anything whose name already exists locally
 * is left untouched (same "merge, don't clobber" rule as favorites/groups),
 * only genuinely new setlists get added. Returns how many were actually added.
 */
export function mergeImportedSetlists(
  incoming: Array<{ name: string; songs: SetlistSongEntry[] }>
): number {
  let added = 0;
  for (const setlist of incoming) {
    if (findSetlistByName(setlist.name)) continue;
    importSetlist(setlist.name, setlist.songs);
    added += 1;
  }
  return added;
}

export function subscribeLocalSetlists(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocalSetlistsSnapshot(): LocalSetlists {
  return setlists;
}
