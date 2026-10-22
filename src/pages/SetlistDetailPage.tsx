import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Share2, Trash2 } from 'lucide-react';
import { SetlistSongRow } from '@/components/setlists/SetlistSongRow';
import { SetlistFormDialog } from '@/components/setlists/SetlistFormDialog';
import { SetlistSongPickerDialog } from '@/components/setlists/SetlistSongPickerDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useLocalSetlists } from '@/hooks/useLocalSetlists';
import { useDragReorder } from '@/hooks/useDragReorder';
import { sortSetlistSongs } from '@/lib/songs/sortAndFilter';
import { downloadSetlistAsFile } from '@/lib/setlistFileTransfer';
import { applySongTonalityToParams } from '@/lib/songKeyPrefs';
import { showToast } from '@/lib/toast';
import { DEFAULT_PAGE_ACTIONS } from '@/types/pageActions';
import type { RootOutletContext } from '@/App';

export function SetlistDetailPage() {
  const { t } = useTranslation();
  const { allSongs, setPageActions, canEdit, openEditSong } = useOutletContext<RootOutletContext>();
  const { setlistId: rawSetlistId } = useParams<{ setlistId: string }>();
  const setlistId = decodeURIComponent(rawSetlistId ?? '');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { getSetlist, renameSetlist, deleteSetlist, removeSongFromSetlist, reorderSetlistSongs } =
    useLocalSetlists();
  const setlist = getSetlist(setlistId);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isAddSongsOpen, setIsAddSongsOpen] = useState(false);

  useEffect(() => {
    setPageActions({ ...DEFAULT_PAGE_ACTIONS, showBack: true });
  }, [setPageActions]);

  const orderedSongs = setlist ? sortSetlistSongs(allSongs, setlist.songs) : [];
  const orderedNames = orderedSongs.map(song => song.Name);

  const dragReorder = useDragReorder({
    items: orderedNames,
    onReorder: nextOrder => reorderSetlistSongs(setlistId, nextOrder),
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
    reorderSetlistSongs(setlistId, current);
  };

  const handleDeleteSetlist = () => {
    if (!setlist) return;
    if (
      window.confirm(
        t('Delete "{{name}}"? This only removes it from this device.', { name: setlist.name })
      )
    ) {
      deleteSetlist(setlistId);
      navigate(`/?${searchParams.toString()}`);
    }
  };

  // Swiping-to-reveal-then-tapping is already the confirmation step, same
  // as deleting a setlist from its list row — a toast afterward is enough.
  const handleRemoveSong = (songName: string) => {
    removeSongFromSetlist(setlistId, songName);
    showToast(
      t('Removed "{{songName}}" from "{{setlistName}}".', {
        songName,
        setlistName: setlist?.name,
      }),
      'success'
    );
  };

  const selectSong = (song: (typeof orderedSongs)[number]) => {
    const next = applySongTonalityToParams(searchParams, song.Name);
    navigate(`/song/${encodeURIComponent(song.Name)}?${next.toString()}`, {
      state: { fromAppNav: true, setlistId },
    });
  };

  if (!setlist) {
    return (
      <div className="p-4">
        <EmptyState
          title={t('Setlist not found')}
          message={t('This setlist no longer exists on this device.')}
        />
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
            <span className="truncate">{setlist.name}</span>
            <Pencil className="w-4 h-4 shrink-0 text-gray-400" />
          </button>
          <button
            type="button"
            title={t('Share setlist')}
            onClick={() => downloadSetlistAsFile(setlist)}
            className="shrink-0 p-2.5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            title={t('Delete setlist')}
            onClick={handleDeleteSetlist}
            className="shrink-0 p-2.5 flex items-center justify-center rounded text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddSongsOpen(true)}
          className="py-2.5 px-4 flex items-center gap-1.5 shrink-0 rounded bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          {t('Add songs')}
        </button>
      </div>

      {displayedSongs.length === 0 && (
        <EmptyState
          title={t('No songs in this setlist yet')}
          message={t('Use "Add songs" to pick some from your catalog.')}
        />
      )}

      {displayedSongs.map((song, index) => (
        <SetlistSongRow
          key={song.Name}
          song={song}
          position={index + 1}
          totalCount={displayedSongs.length}
          isDragging={dragReorder.draggingName === song.Name}
          rowRef={dragReorder.setRowRef(song.Name)}
          handleProps={dragReorder.getHandleProps(song.Name)}
          onSelect={selectSong}
          onPositionCommit={newPosition => movePosition(song.Name, newPosition)}
          onRemoveFromSetlist={() => handleRemoveSong(song.Name)}
          canEdit={canEdit}
          onEdit={openEditSong}
        />
      ))}

      <SetlistFormDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        initialName={setlist.name}
        onSubmit={name => renameSetlist(setlistId, name)}
      />
      <SetlistSongPickerDialog
        open={isAddSongsOpen}
        onOpenChange={setIsAddSongsOpen}
        setlistId={setlistId}
        allSongs={allSongs}
      />
    </div>
  );
}
