const STORAGE_KEY = 'localAlbums';

type Listener = () => void;

export interface AlbumSongEntry {
  songName: string;
  /** Explicit manual position (drag-drop or typed index) — sparse, see sortAlbumSongs. */
  customIndex?: number;
}

export interface Album {
  id: string;
  name: string;
  createdAt: number;
  songs: AlbumSongEntry[];
}

export type LocalAlbums = Record<string, Album>; // album id -> Album

function loadFromStorage(): LocalAlbums {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalAlbums) : {};
  } catch {
    return {};
  }
}

let albums = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `album-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createAlbum(name: string): Album {
  const clean = name.replace(/[\r\n]+/g, ' ').trim();
  const album: Album = {
    id: generateId(),
    name: clean || 'Untitled album',
    createdAt: Date.now(),
    songs: [],
  };
  albums = { ...albums, [album.id]: album };
  persist();
  return album;
}

export function renameAlbum(albumId: string, name: string) {
  const album = albums[albumId];
  if (!album) return;
  const clean = name.replace(/[\r\n]+/g, ' ').trim();
  if (!clean) return;
  albums = { ...albums, [albumId]: { ...album, name: clean } };
  persist();
}

export function deleteAlbum(albumId: string) {
  if (!albums[albumId]) return;
  const next = { ...albums };
  delete next[albumId];
  albums = next;
  persist();
}

export function addSongToAlbum(albumId: string, songName: string) {
  const album = albums[albumId];
  if (!album) return;
  if (album.songs.some(entry => entry.songName === songName)) return;
  albums = {
    ...albums,
    [albumId]: { ...album, songs: [...album.songs, { songName }] },
  };
  persist();
}

export function removeSongFromAlbum(albumId: string, songName: string) {
  const album = albums[albumId];
  if (!album) return;
  albums = {
    ...albums,
    [albumId]: { ...album, songs: album.songs.filter(entry => entry.songName !== songName) },
  };
  persist();
}

/** Sparse — sets just this song's position, leaves every other entry untouched. Pass null to clear. */
export function setSongCustomIndex(albumId: string, songName: string, index: number | null) {
  const album = albums[albumId];
  if (!album) return;
  const nextSongs = album.songs.map(entry =>
    entry.songName === songName
      ? { ...entry, customIndex: index == null ? undefined : index }
      : entry
  );
  albums = { ...albums, [albumId]: { ...album, songs: nextSongs } };
  persist();
}

/** Drag-drop commit — locks in the exact visual order as sequential custom indices for everyone. */
export function reorderAlbumSongs(albumId: string, orderedSongNames: string[]) {
  const album = albums[albumId];
  if (!album) return;
  const byName = new Map(album.songs.map(entry => [entry.songName, entry]));
  const nextSongs = orderedSongNames.map((songName, index) => ({
    ...(byName.get(songName) ?? { songName }),
    customIndex: index,
  }));
  albums = { ...albums, [albumId]: { ...album, songs: nextSongs } };
  persist();
}

/** Case-insensitive — used to detect a naming conflict when importing a shared album. */
export function findAlbumByName(name: string): Album | undefined {
  const target = name.trim().toLowerCase();
  return Object.values(albums).find(album => album.name.trim().toLowerCase() === target);
}

/**
 * Creates an album from imported data, or — given `replaceId` — overwrites
 * an existing one in place (keeps its id, so it stays the same album rather
 * than leaving a duplicate behind).
 */
export function importAlbum(name: string, songs: AlbumSongEntry[], replaceId?: string): Album {
  const clean = name.replace(/[\r\n]+/g, ' ').trim() || 'Untitled album';

  if (replaceId && albums[replaceId]) {
    const album: Album = { ...albums[replaceId], name: clean, songs };
    albums = { ...albums, [replaceId]: album };
    persist();
    return album;
  }

  const album: Album = { id: generateId(), name: clean, createdAt: Date.now(), songs };
  albums = { ...albums, [album.id]: album };
  persist();
  return album;
}

export function getAlbumsForSong(songName: string): Album[] {
  return Object.values(albums).filter(album =>
    album.songs.some(entry => entry.songName === songName)
  );
}

export function getAllAlbums(): Album[] {
  return Object.values(albums);
}

/**
 * Bulk import (Settings → Backup) — unlike the single-album import flow,
 * this never prompts per album: anything whose name already exists locally
 * is left untouched (same "merge, don't clobber" rule as favorites/groups),
 * only genuinely new albums get added. Returns how many were actually added.
 */
export function mergeImportedAlbums(
  incoming: Array<{ name: string; songs: AlbumSongEntry[] }>
): number {
  let added = 0;
  for (const album of incoming) {
    if (findAlbumByName(album.name)) continue;
    importAlbum(album.name, album.songs);
    added += 1;
  }
  return added;
}

export function subscribeLocalAlbums(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocalAlbumsSnapshot(): LocalAlbums {
  return albums;
}
