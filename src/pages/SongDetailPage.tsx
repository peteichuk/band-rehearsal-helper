import { useEffect, useState, useSyncExternalStore } from 'react';
import { useOutletContext, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, Pencil, Pin, Star } from 'lucide-react';
import { SongLinks } from '@/components/song-detail/SongLinks';
import { TransposeControls } from '@/components/song-detail/TransposeControls';
import { ZoomControls, DEFAULT_FONT_SIZE } from '@/components/song-detail/ZoomControls';
import { ColumnSelect, DEFAULT_COLUMN_CLASS } from '@/components/song-detail/ColumnSelect';
import { LineToggleButtons } from '@/components/song-detail/LineToggleButtons';
import { SongContent } from '@/components/song-detail/SongContent';
import { SongNavigation } from '@/components/song-detail/SongNavigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSongNavigation } from '@/hooks/useSongNavigation';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { usePinOverrides, useEffectivePinsSet } from '@/hooks/useEffectivePins';
import { togglePinOverride } from '@/lib/localPins';
import { isEffectivelyPinned } from '@/lib/songs/effectivePins';
import { getLocalFavoritesSnapshot, subscribeLocalFavorites } from '@/lib/localFavorites';
import { useLocalFavorites } from '@/hooks/useLocalFavorites';
import { songsForNavigation } from '@/lib/songs/sortAndFilter';
import { useLocalGroups } from '@/hooks/useLocalGroups';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import { cn } from '@/lib/utils';
import type { RootOutletContext } from '@/App';
import type { TransposeOption } from '@/lib/chords/transpose';
import type { Song } from '@/types/song';

export function SongDetailPage() {
  const { allSongs, setPageActions, canEdit, openEditSong } = useOutletContext<RootOutletContext>();
  const { songName } = useParams<{ songName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetTonality = searchParams.get('tonality');

  // Prev/next always cycles through favorites specifically — the "setlist"
  // you're browsing during rehearsal — regardless of how you got to this song.
  // Until the user curates their own favorites, fall back to pinned songs so
  // there's always a sensible setlist to browse out of the box.
  const localFavoriteNames = useSyncExternalStore(
    subscribeLocalFavorites,
    getLocalFavoritesSnapshot
  );
  const pinOverrides = usePinOverrides();
  const effectivePinnedNames = useEffectivePinsSet(allSongs);
  const navigationList = songsForNavigation(allSongs, localFavoriteNames, effectivePinnedNames);
  const song = allSongs.find(candidate => candidate.Name === decodeURIComponent(songName ?? ''));
  const navigation = useSongNavigation(song ?? null, navigationList);

  const [transpose, setTranspose] = useState<TransposeOption | null>(null);
  const [fontSize, setFontSize] = useLocalStorageState('songContentFontSize', DEFAULT_FONT_SIZE);
  const [columnClass, setColumnClass] = useLocalStorageState(
    'selectedColumnClass',
    DEFAULT_COLUMN_CLASS
  );
  const [hideTextLine, setHideTextLine] = useLocalStorageState('hideTextLine', false);
  const [hideChordLine, setHideChordLine] = useLocalStorageState('hideChordLine', false);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const { getGroups } = useLocalGroups();
  const { isFavorite, toggleFavorite } = useLocalFavorites();

  const text = song?.Text || '';

  useEffect(() => {
    setPageActions({
      showBack: true,
      showPrint: Boolean(text),
      shareTitle: song?.Name ?? null,
      metronomeBpm: song?.BPM ?? null,
    });
  }, [setPageActions, text, song?.Name, song?.BPM]);

  // Jump to the top of the song on open, and again every time prev/next swaps
  // to a different song (the route param changes but this page doesn't
  // remount, so a mount-only effect wouldn't catch those).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [song?.Name]);

  const goToSong = (nextSong: Song) => {
    navigate(`/song/${encodeURIComponent(nextSong.Name)}?${searchParams.toString()}`);
  };

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => navigation.next && goToSong(navigation.next),
    onSwipeRight: () => navigation.prev && goToSong(navigation.prev),
    onEdgeSwipeBack: () => navigate(`/?${searchParams.toString()}`),
  });

  if (!song) {
    return (
      <div className="p-4">
        <EmptyState title="Song not found" message="This song is no longer in the loaded list." />
      </div>
    );
  }

  const originalTonality = song.Tonality || 'C';
  const pinned = isEffectivelyPinned(song, pinOverrides);
  const myGroups = getGroups(song.Name);
  const isLocalFavorite = isFavorite(song.Name);

  return (
    <div className="p-2 py-4" {...swipeHandlers}>
      <h2 className="text-2xl font-bold mb-2">
        {song.Name || 'Untitled'}{' '}
        <span className="text-xs text-blue-600 dark:text-blue-400 mb-2">
          Tonality: <span className="font-semibold">{song.Tonality || '-'}</span>
        </span>{' '}
        <span className="text-xs text-orange-600 mb-2">
          BPM: <span className="font-semibold">{song.BPM ?? '-'}</span>
        </span>
        <button
          type="button"
          title={pinned ? 'Unpin' : 'Pin to top'}
          onClick={() => togglePinOverride(song.Name, pinned)}
          className={cn(
            'print:hidden inline-flex align-middle ml-1 p-1 hover:text-yellow-500 dark:hover:text-yellow-400',
            pinned ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400'
          )}
        >
          <Pin className="w-4 h-4" fill={pinned ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          title={isLocalFavorite ? 'Remove from my favorites' : 'Add to my favorites'}
          onClick={() => toggleFavorite(song.Name)}
          className={cn(
            'print:hidden inline-flex align-middle ml-1 p-1 hover:text-yellow-500 dark:hover:text-yellow-400',
            isLocalFavorite ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400'
          )}
        >
          <Star className="w-4 h-4" fill={isLocalFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          title={myGroups.length > 0 ? 'Edit my groups' : 'Add to a group'}
          onClick={() => setIsGroupEditorOpen(true)}
          className={cn(
            'print:hidden inline-flex align-middle ml-1 p-1 hover:text-teal-600 dark:hover:text-teal-400',
            myGroups.length > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'
          )}
        >
          <Bookmark className="w-4 h-4" fill={myGroups.length > 0 ? 'currentColor' : 'none'} />
        </button>
        {canEdit && (
          <button
            type="button"
            title="Edit song"
            onClick={() => openEditSong(song)}
            className="print:hidden inline-flex align-middle ml-1 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </h2>

      <div id="song-toolbar" className="print:hidden flex flex-wrap items-center gap-3 mb-2">
        <SongLinks song={song} />

        {text && (
          <>
            <div className="h-9 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />
            <ZoomControls fontSize={fontSize} onChange={setFontSize} />
            <div className="h-9 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />
            <TransposeControls
              originalTonality={originalTonality}
              targetTonality={targetTonality}
              onTransposeChange={option => {
                setTranspose(option);
                setSearchParams(
                  prev => {
                    const next = new URLSearchParams(prev);
                    if (option.isOriginal) next.delete('tonality');
                    else next.set('tonality', option.tonalityName);
                    return next;
                  },
                  { replace: true }
                );
              }}
            />
            <div className="h-9 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />
            <ColumnSelect value={columnClass} onChange={setColumnClass} />
            <div className="h-9 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />
            <LineToggleButtons
              hideTextLine={hideTextLine}
              hideChordLine={hideChordLine}
              onToggleTextLine={() => setHideTextLine(!hideTextLine)}
              onToggleChordLine={() => setHideChordLine(!hideChordLine)}
            />
          </>
        )}
      </div>

      {text ? (
        <SongContent
          text={text}
          steps={transpose?.steps ?? 0}
          useFlats={transpose?.useFlats ?? false}
          columnClass={columnClass}
          hideTextLine={hideTextLine}
          hideChordLine={hideChordLine}
          fontSize={fontSize}
        />
      ) : (
        <EmptyState
          title="Text not found for this song"
          message="The selected song does not have any text available."
        />
      )}

      <SongNavigation navigation={navigation} onNavigate={goToSong} />

      <GroupEditorDialog
        open={isGroupEditorOpen}
        onOpenChange={setIsGroupEditorOpen}
        songName={song.Name}
      />
    </div>
  );
}
