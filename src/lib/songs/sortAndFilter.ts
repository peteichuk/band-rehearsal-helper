import type { Song } from '@/types/song';
import type { SetlistSongEntry } from '@/lib/localSetlists';

/**
 * Effectively-pinned songs first (sheet's `PinedByDefault` column, overridden
 * locally where the user has toggled it) — within that group, songs with a
 * parseable SortingPriority sort by it, the rest alphabetically. Everything
 * else follows, alphabetically.
 */
export function sortForDisplay(songs: Song[], effectivePinnedNames?: Set<string>): Song[] {
  const named = songs.filter(song => song.Name);
  const alphabetical = [...named].sort((a, b) => a.Name.localeCompare(b.Name));

  if (!effectivePinnedNames) return alphabetical;

  const pinned = alphabetical.filter(song => effectivePinnedNames.has(song.Name));
  const rest = alphabetical.filter(song => !effectivePinnedNames.has(song.Name));

  const pinnedWithPriority = pinned.filter(
    song => song.SortingPriority != null && !Number.isNaN(Number(song.SortingPriority))
  );
  const pinnedWithoutPriority = pinned.filter(
    song => song.SortingPriority == null || Number.isNaN(Number(song.SortingPriority))
  );

  return [
    ...[...pinnedWithPriority].sort(
      (a, b) => Number(a.SortingPriority) - Number(b.SortingPriority)
    ),
    ...pinnedWithoutPriority,
    ...rest,
  ];
}

export function filterBySearch(songs: Song[], query: string): Song[] {
  const q = query.trim().toLowerCase();
  if (!q) return songs;
  return songs.filter(song =>
    [song.Name, song.Language, song.GroupBy].some(field => field?.toLowerCase().includes(q))
  );
}

/** Matches the sheet's `GroupBy` column OR any locally-added custom group for that song. */
export function filterByGroup(
  songs: Song[],
  group: string,
  localGroups: Record<string, string[]> = {}
): Song[] {
  return songs.filter(
    song => song.GroupBy === group || (localGroups[song.Name] ?? []).includes(group)
  );
}

/** Multi-select: keeps songs whose Language is one of the selected ones (no selection = no filtering). */
export function filterByLanguages(songs: Song[], languages: string[]): Song[] {
  if (languages.length === 0) return songs;
  return songs.filter(song => song.Language != null && languages.includes(song.Language));
}

/**
 * The set prev/next navigates within. Whenever favorites is empty — a fresh
 * install, or everything got unstarred again — falls back to whatever's
 * effectively pinned, so there's always a sensible setlist to browse. As
 * soon as at least one song is starred, navigation uses that list instead.
 */
/**
 * Order for songs inside a setlist: entries with an explicit `customIndex`
 * (set by dragging or typing a position) come first, sorted by it; every
 * other song in the setlist follows, alphabetically. Sparse by design — most
 * songs never get a customIndex at all. Songs no longer present in `songs`
 * (e.g. removed from the sheet) are dropped.
 */
export function sortSetlistSongs(songs: Song[], entries: SetlistSongEntry[]): Song[] {
  const byName = new Map(songs.map(song => [song.Name, song]));
  const present = entries
    .map(entry => ({ entry, song: byName.get(entry.songName) }))
    .filter((x): x is { entry: SetlistSongEntry; song: Song } => Boolean(x.song));

  const withIndex = present.filter(x => x.entry.customIndex != null);
  const withoutIndex = present.filter(x => x.entry.customIndex == null);

  withIndex.sort((a, b) => Number(a.entry.customIndex) - Number(b.entry.customIndex));
  withoutIndex.sort((a, b) => a.song.Name.localeCompare(b.song.Name));

  return [...withIndex, ...withoutIndex].map(x => x.song);
}

export function songsForNavigation(
  songs: Song[],
  localFavoriteNames: Set<string>,
  effectivePinnedNames: Set<string>
): Song[] {
  const navigationSet = localFavoriteNames.size > 0 ? localFavoriteNames : effectivePinnedNames;
  return songs.filter(song => navigationSet.has(song.Name));
}
