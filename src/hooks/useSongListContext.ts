import { useMemo, useSyncExternalStore } from 'react';
import {
  filterBySearch,
  filterByGroup,
  filterByLanguages,
  songsForNavigation,
} from '@/lib/songs/sortAndFilter';
import { getLocalFavoritesSnapshot, subscribeLocalFavorites } from '@/lib/localFavorites';
import { getLocalGroupsSnapshot, subscribeLocalGroups } from '@/lib/localGroups';
import type { Song } from '@/types/song';

export type ListContext = 'all' | 'search' | 'group' | 'favorites';

export interface SongListContextParams {
  list: ListContext;
  q?: string | null;
  group?: string | null;
  languages?: string[];
}

/**
 * Recomputes the ordered/filtered song list purely from the already-sorted
 * `allSongs` list plus URL params — deterministic and shareable, no need to
 * persist a list of song ids anywhere. The language filter is a facet that
 * further narrows whatever `list` mode is active, rather than a mode itself.
 */
export function useSongListContext(allSongs: Song[], params: SongListContextParams): Song[] {
  const localFavorites = useSyncExternalStore(subscribeLocalFavorites, getLocalFavoritesSnapshot);
  const localGroups = useSyncExternalStore(subscribeLocalGroups, getLocalGroupsSnapshot);
  const languages = params.languages ?? [];

  return useMemo(() => {
    let result: Song[];
    switch (params.list) {
      case 'search':
        result = filterBySearch(allSongs, params.q ?? '');
        break;
      case 'group':
        result = params.group ? filterByGroup(allSongs, params.group, localGroups) : allSongs;
        break;
      case 'favorites':
        // Not wired to any list-page UI yet (prev/next's fallback-to-pinned
        // behavior lives in SongDetailPage); here it's just the user's own list.
        result = songsForNavigation(allSongs, localFavorites, localFavorites);
        break;
      default:
        result = allSongs;
    }
    return filterByLanguages(result, languages);
  }, [allSongs, params.list, params.q, params.group, localFavorites, localGroups, languages]);
}
