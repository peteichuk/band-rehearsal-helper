import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Folder, LayoutGrid, List, Plus, Share2, Trash2 } from 'lucide-react';
import { ToggleButtonPair } from '@/components/shared/ToggleButtonPair';
import { SwipeToDeleteRow } from '@/components/shared/SwipeToDeleteRow';
import { AlbumFormDialog } from '@/components/albums/AlbumFormDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useLocalAlbums } from '@/hooks/useLocalAlbums';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { downloadAlbumAsFile, parseAlbumFile } from '@/lib/albumFileTransfer';
import type { Album } from '@/lib/localAlbums';
import type { Song } from '@/types/song';

interface AlbumsViewProps {
  allSongs: Song[];
}

export function AlbumsView({ allSongs }: AlbumsViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { allAlbums, createAlbum, deleteAlbum, findAlbumByName, importAlbum } = useLocalAlbums();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tableId (and anything else already in the URL) has to ride along, or
  // the album page loses it and the catalog it needs to resolve songs from.
  const openAlbum = (albumId: string) =>
    navigate(`/albums/${encodeURIComponent(albumId)}?${searchParams.toString()}`);
  const [displayMode, setDisplayMode] = useLocalStorageState<'tiles' | 'list'>(
    'albumsDisplayMode',
    'tiles'
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const songCount = (albumId: string) => {
    const album = allAlbums.find(candidate => candidate.id === albumId);
    if (!album) return 0;
    const presentNames = new Set(allSongs.map(song => song.Name));
    return album.songs.filter(entry => presentNames.has(entry.songName)).length;
  };

  const confirmDeleteAlbum = (album: Album) => {
    if (window.confirm(`Delete "${album.name}"? This only removes it from this device.`)) {
      deleteAlbum(album.id);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const { name, songs } = await parseAlbumFile(file);
      const existing = findAlbumByName(name);
      if (existing) {
        const replace = window.confirm(
          `An album named "${name}" already exists. Replace it with the imported version?`
        );
        if (!replace) return;
        importAlbum(name, songs, existing.id);
      } else {
        importAlbum(name, songs);
      }
    } catch (err) {
      window.alert(`Import failed: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <ToggleButtonPair
          value={displayMode}
          onChange={setDisplayMode}
          activeClassName="bg-blue-700 dark:bg-blue-600 text-white"
          inactiveClassName="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          options={[
            { value: 'tiles', label: 'Tiles', icon: <LayoutGrid className="w-4 h-4" /> },
            { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
          ]}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3 flex items-center gap-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Import
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3 flex items-center gap-1.5 rounded bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New album
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      {allAlbums.length === 0 && (
        <EmptyState
          title="No albums yet"
          message='Create one with "New album", or add a song to an album from its ⋮ menu.'
        />
      )}

      {allAlbums.length > 0 && displayMode === 'tiles' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allAlbums.map(album => (
            <div
              key={album.id}
              role="button"
              tabIndex={0}
              onClick={() => openAlbum(album.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openAlbum(album.id);
                }
              }}
              className="relative cursor-pointer rounded bg-blue-100 dark:bg-gray-800 hover:bg-blue-200 dark:hover:bg-gray-700 p-3 flex flex-col items-center gap-1 text-center"
            >
              <div className="absolute top-1 right-1 flex items-center gap-0.5">
                <button
                  type="button"
                  title="Share album"
                  onClick={event => {
                    event.stopPropagation();
                    downloadAlbumAsFile(album);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete album"
                  onClick={event => {
                    event.stopPropagation();
                    confirmDeleteAlbum(album);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Folder className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium break-words">{album.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {songCount(album.id)} song{songCount(album.id) === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}

      {allAlbums.length > 0 && displayMode === 'list' && (
        <div className="space-y-1">
          {allAlbums.map(album => (
            <SwipeToDeleteRow key={album.id} onDelete={() => confirmDeleteAlbum(album)}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openAlbum(album.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openAlbum(album.id);
                  }
                }}
                className="w-full px-2 py-2 flex items-center gap-2 rounded bg-blue-100 dark:bg-gray-800 hover:bg-blue-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Folder className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="flex-1 min-w-0 truncate font-medium">{album.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {songCount(album.id)} song{songCount(album.id) === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  title="Share album"
                  onClick={event => {
                    event.stopPropagation();
                    downloadAlbumAsFile(album);
                  }}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </SwipeToDeleteRow>
          ))}
        </div>
      )}

      <AlbumFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={name => createAlbum(name)}
      />
    </div>
  );
}
