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
  reorderSetlists,
  reorderSetlistSongs,
  setSongCustomIndex,
  sortSetlists,
  subscribeLocalSetlists,
} from '@/lib/localSetlists';
import type { Setlist } from '@/lib/localSetlists';

export function useLocalSetlists() {
  const setlists = useSyncExternalStore(subscribeLocalSetlists, getLocalSetlistsSnapshot);

  const allSetlists = useMemo<Setlist[]>(() => sortSetlists(Object.values(setlists)), [setlists]);

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
    reorderSetlists,
    findSetlistByName,
    importSetlist,
  };
}

export { getSetlistsForSong };
