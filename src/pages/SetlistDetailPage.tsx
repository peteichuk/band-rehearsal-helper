import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { MoreVertical, Pencil, Plus, Share2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SetlistSongRow } from '@/components/setlists/SetlistSongRow';
import { SetlistFormDialog } from '@/components/setlists/SetlistFormDialog';
import { SetlistSongPickerDialog } from '@/components/setlists/SetlistSongPickerDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScrollToTopButton } from '@/components/shared/ScrollToTopButton';
import { useLocalSetlists } from '@/hooks/useLocalSetlists';
import { useDragReorder } from '@/hooks/useDragReorder';
import { sortSetlistSongs } from '@/lib/songs/sortAndFilter';
import { downloadSetlistAsFile } from '@/lib/setlistFileTransfer';
import { applySongTonalityToParams } from '@/lib/songKeyPrefs';
import { showToast } from '@/lib/toast';
import { getSetlistSongsScrollTop, saveSetlistSongsScrollTop } from '@/lib/scrollMemory';
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

  // Restores wherever this setlist's song list was scrolled to before a song
  // was opened from it — but opening the setlist fresh (from the setlists
  // list) already resets that memory to 0 first (see SetlistsView's
  // openSetlist), so this still starts at the top in that case.
  useEffect(() => {
    window.scrollTo({ top: getSetlistSongsScrollTop() });
  }, []);

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
    saveSetlistSongsScrollTop(window.scrollY);
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
        <span className="truncate text-xl font-bold min-w-0 flex-1">{setlist.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={t('More options')}
              className="shrink-0 p-2.5 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsAddSongsOpen(true)}>
              <Plus className="size-5" />
              {t('Add songs')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => downloadSetlistAsFile(setlist)}>
              <Share2 className="size-5" />
              {t('Share setlist')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
              <Pencil className="size-5" />
              {t('Rename setlist')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleDeleteSetlist} variant="destructive">
              <Trash2 className="size-5" />
              {t('Delete setlist')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      <ScrollToTopButton />

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
