import { useMemo, useSyncExternalStore } from 'react';
import {
  addSongToSetlist,
  createSetlist,
  deleteSetlist,
  findSetlistByName,
  getSetlistsForSong,
  getLocalSetlistsSnapshot,
  importSetlist,
  removeSongFromSetlist,
  renameSetlist,
  reorderSetlistSongs,
  setSongCustomIndex,
  subscribeLocalSetlists,
} from '@/lib/localSetlists';
import type { Setlist } from '@/lib/localSetlists';

export function useLocalSetlists() {
  const setlists = useSyncExternalStore(subscribeLocalSetlists, getLocalSetlistsSnapshot);

  const allSetlists = useMemo<Setlist[]>(
    () => Object.values(setlists).sort((a, b) => a.name.localeCompare(b.name)),
    [setlists]
  );

  return {
    setlists,
    allSetlists,
    getSetlist: (setlistId: string): Setlist | undefined => setlists[setlistId],
    getSetlistsForSong: (songName: string): Setlist[] =>
      allSetlists.filter(setlist => setlist.songs.some(entry => entry.songName === songName)),
    createSetlist,
    renameSetlist,
    deleteSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    setSongCustomIndex,
    reorderSetlistSongs,
    findSetlistByName,
    importSetlist,
  };
}

export { getSetlistsForSong };
