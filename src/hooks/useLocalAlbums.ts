import { useMemo, useSyncExternalStore } from 'react';
import {
  addSongToAlbum,
  createAlbum,
  deleteAlbum,
  findAlbumByName,
  getAlbumsForSong,
  getLocalAlbumsSnapshot,
  importAlbum,
  removeSongFromAlbum,
  renameAlbum,
  reorderAlbumSongs,
  setSongCustomIndex,
  subscribeLocalAlbums,
} from '@/lib/localAlbums';
import type { Album } from '@/lib/localAlbums';

export function useLocalAlbums() {
  const albums = useSyncExternalStore(subscribeLocalAlbums, getLocalAlbumsSnapshot);

  const allAlbums = useMemo<Album[]>(
    () => Object.values(albums).sort((a, b) => a.name.localeCompare(b.name)),
    [albums]
  );

  return {
    albums,
    allAlbums,
    getAlbum: (albumId: string): Album | undefined => albums[albumId],
    getAlbumsForSong: (songName: string): Album[] =>
      allAlbums.filter(album => album.songs.some(entry => entry.songName === songName)),
    createAlbum,
    renameAlbum,
    deleteAlbum,
    addSongToAlbum,
    removeSongFromAlbum,
    setSongCustomIndex,
    reorderAlbumSongs,
    findAlbumByName,
    importAlbum,
  };
}

export { getAlbumsForSong };
