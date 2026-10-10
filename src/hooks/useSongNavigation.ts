import { useMemo } from 'react';
import type { Song } from '@/types/song';

export interface SongNavigation {
  prev: Song | null;
  next: Song | null;
  currentIndex: number;
}

/** Generic prev/next within whatever ordered list context is currently active. */
export function useSongNavigation(song: Song | null, orderedList: Song[]): SongNavigation {
  return useMemo(() => {
    if (!song) return { prev: null, next: null, currentIndex: -1 };

    const currentIndex = orderedList.findIndex(candidate => candidate.Name === song.Name);
    if (currentIndex === -1) return { prev: null, next: null, currentIndex: -1 };

    return {
      prev: currentIndex > 0 ? orderedList[currentIndex - 1] : null,
      next: currentIndex < orderedList.length - 1 ? orderedList[currentIndex + 1] : null,
      currentIndex,
    };
  }, [song, orderedList]);
}
