import type { Song } from '@/types/song';

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
export function songsForNavigation(
  songs: Song[],
  localFavoriteNames: Set<string>,
  effectivePinnedNames: Set<string>
): Song[] {
  const navigationSet = localFavoriteNames.size > 0 ? localFavoriteNames : effectivePinnedNames;
  return songs.filter(song => navigationSet.has(song.Name));
}
