import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Share2, Trash2 } from 'lucide-react';
import { AlbumSongRow } from '@/components/albums/AlbumSongRow';
import { AlbumFormDialog } from '@/components/albums/AlbumFormDialog';
import { AlbumSongPickerDialog } from '@/components/albums/AlbumSongPickerDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useLocalAlbums } from '@/hooks/useLocalAlbums';
import { useDragReorder } from '@/hooks/useDragReorder';
import { sortAlbumSongs } from '@/lib/songs/sortAndFilter';
import { downloadAlbumAsFile } from '@/lib/albumFileTransfer';
import { applySongTonalityToParams } from '@/lib/songKeyPrefs';
import { DEFAULT_PAGE_ACTIONS } from '@/types/pageActions';
import type { RootOutletContext } from '@/App';

export function AlbumDetailPage() {
  const { allSongs, setPageActions, canEdit, openEditSong } = useOutletContext<RootOutletContext>();
  const { albumId: rawAlbumId } = useParams<{ albumId: string }>();
  const albumId = decodeURIComponent(rawAlbumId ?? '');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { getAlbum, renameAlbum, deleteAlbum, removeSongFromAlbum, reorderAlbumSongs } =
    useLocalAlbums();
  const album = getAlbum(albumId);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isAddSongsOpen, setIsAddSongsOpen] = useState(false);

  useEffect(() => {
    setPageActions({ ...DEFAULT_PAGE_ACTIONS, showBack: true });
  }, [setPageActions]);

  const orderedSongs = album ? sortAlbumSongs(allSongs, album.songs) : [];
  const orderedNames = orderedSongs.map(song => song.Name);

  const dragReorder = useDragReorder({
    items: orderedNames,
    onReorder: nextOrder => reorderAlbumSongs(albumId, nextOrder),
  });

  const songsByName = new Map(orderedSongs.map(song => [song.Name, song]));
  const displayedSongs = dragReorder.orderedNames
    .map(name => songsByName.get(name))
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  const movePosition = (songName: string, newPosition: number) => {
    const current = [...orderedNames];
    const from = current.indexOf(songName);
    if (from === -1) return;
    current.splice(from, 1);
    current.splice(Math.min(Math.max(0, newPosition - 1), current.length), 0, songName);
    reorderAlbumSongs(albumId, current);
  };

  const handleDeleteAlbum = () => {
    if (!album) return;
    if (window.confirm(`Delete "${album.name}"? This only removes it from this device.`)) {
      deleteAlbum(albumId);
      navigate(`/?${searchParams.toString()}`);
    }
  };

  const selectSong = (song: (typeof orderedSongs)[number]) => {
    const next = applySongTonalityToParams(searchParams, song.Name);
    navigate(`/song/${encodeURIComponent(song.Name)}?${next.toString()}`, {
      state: { fromAppNav: true, albumId },
    });
  };

  if (!album) {
    return (
      <div className="p-4">
        <EmptyState title="Album not found" message="This album no longer exists on this device." />
      </div>
    );
  }

  return (
    <div className="p-2 py-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsRenameOpen(true)}
            className="flex items-center gap-1.5 text-xl font-bold min-w-0"
          >
            <span className="truncate">{album.name}</span>
            <Pencil className="w-4 h-4 shrink-0 text-gray-400" />
          </button>
          <button
            type="button"
            title="Share album"
            onClick={() => downloadAlbumAsFile(album)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Delete album"
            onClick={handleDeleteAlbum}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddSongsOpen(true)}
          className="h-9 px-3 flex items-center gap-1.5 shrink-0 rounded bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add songs
        </button>
      </div>

      {displayedSongs.length === 0 && (
        <EmptyState
          title="No songs in this album yet"
          message='Use "Add songs" to pick some from your catalog.'
        />
      )}

      {displayedSongs.map((song, index) => (
        <AlbumSongRow
          key={song.Name}
          song={song}
          position={index + 1}
          totalCount={displayedSongs.length}
          isDragging={dragReorder.draggingName === song.Name}
          rowRef={dragReorder.setRowRef(song.Name)}
          handleProps={dragReorder.getHandleProps(song.Name)}
          onSelect={selectSong}
          onPositionCommit={newPosition => movePosition(song.Name, newPosition)}
          onRemoveFromAlbum={() => removeSongFromAlbum(albumId, song.Name)}
          canEdit={canEdit}
          onEdit={openEditSong}
        />
      ))}

      <AlbumFormDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        initialName={album.name}
        onSubmit={name => renameAlbum(albumId, name)}
      />
      <AlbumSongPickerDialog
        open={isAddSongsOpen}
        onOpenChange={setIsAddSongsOpen}
        albumId={albumId}
        allSongs={allSongs}
      />
    </div>
  );
}
