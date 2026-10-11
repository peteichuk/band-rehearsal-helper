import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  useOutletContext,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Bookmark, Pin, SlidersHorizontal, Star } from 'lucide-react';
import { SongOverflowMenu } from '@/components/song-detail/SongOverflowMenu';
import { SongControlsPanel } from '@/components/song-detail/SongControlsPanel';
import { DEFAULT_FONT_SIZE } from '@/components/song-detail/ZoomControls';
import { DEFAULT_COLUMN_CLASS } from '@/components/song-detail/ColumnSelect';
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
import {
  applySongTonalityToParams,
  deleteSongTonalityPref,
  getSongTonalityPref,
  setSongTonalityPref,
} from '@/lib/songKeyPrefs';
import { getTransposeOptionForSteps, wrapCapoSteps } from '@/lib/chords/transpose';
import { cn } from '@/lib/utils';
import type { RootOutletContext } from '@/App';
import type { TransposeOption } from '@/lib/chords/transpose';
import type { Song } from '@/types/song';

export function SongDetailPage() {
  const { allSongs, setPageActions, canEdit, openEditSong, onOpenMetronome } =
    useOutletContext<RootOutletContext>();
  const { songName } = useParams<{ songName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Set by selectSong/goToSong (list, prev/next, swipe) — anything that's
  // genuinely navigating within the app, as opposed to a cold landing on
  // this song's bare URL (fresh load, refresh, bookmark, external link).
  const cameFromInAppNav = Boolean((location.state as { fromAppNav?: boolean } | null)?.fromAppNav);

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
  const [isControlsOpen, setIsControlsOpen] = useState(false);
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

  // A link's own ?tonality= wins (it's an explicit share). Otherwise, a
  // saved pref only applies when we actually navigated here in-app (list,
  // prev/next, swipe) — a cold landing on the bare URL always shows the
  // original key, even if this song has a forgotten pref from a past visit.
  const songTonalityPref = song ? getSongTonalityPref(song.Name) : null;
  const targetTonality =
    searchParams.get('tonality') ?? (cameFromInAppNav ? songTonalityPref : null);

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

  useEffect(() => {
    if (!song) return;
    const urlTonality = searchParams.get('tonality');

    if (!cameFromInAppNav) {
      // A true cold landing on this song with no explicit ?tonality= — reset:
      // drop any stale saved pref so this (and every future cold visit) shows
      // the original key until the user explicitly picks something again.
      if (urlTonality === null) deleteSongTonalityPref(song.Name);
      return;
    }

    // Safety net for flipping through songs fast enough that goToSong's own
    // URL rewrite (applySongTonalityToParams) loses the race against the next
    // swipe's deferred navigation: whenever the song we're actually looking
    // at changes, re-check ?tonality= against *this* song's own saved pref
    // and correct it — never adopt a stray value as if it were deliberate.
    const pref = getSongTonalityPref(song.Name);
    if (urlTonality === (pref ?? null)) return;

    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (pref) next.set('tonality', pref);
        else next.delete('tonality');
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.Name]);

  const goToSong = (nextSong: Song) => {
    // Each song has its own saved tonality (see songKeyPrefs) — always wipe
    // ?tonality= first, then re-add it only if the song we're headed to
    // actually has one saved. Never carry the song we're leaving's choice.
    const next = applySongTonalityToParams(searchParams, nextSong.Name);
    navigate(`/song/${encodeURIComponent(nextSong.Name)}?${next.toString()}`, {
      state: { fromAppNav: true },
    });
  };

  const goHome = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('tonality');
    navigate(`/?${next.toString()}`);
  };

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => navigation.next && goToSong(navigation.next),
    onSwipeRight: () => navigation.prev && goToSong(navigation.prev),
    onEdgeSwipeBack: goHome,
    hasNext: Boolean(navigation.next),
    hasPrev: Boolean(navigation.prev),
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

  const handleTransposeChange = (option: TransposeOption) => {
    setTranspose(option);

    // TransposeControls fires this both for a real pick and for the
    // automatic restore it does whenever the song changes — but goToSong
    // already seeds the URL correctly for a restore (see
    // applySongTonalityToParams), so the restore's own option always
    // matches what's already there. Only act when it doesn't, i.e. only for
    // a genuine pick: a restore must never touch storage either, or it can
    // shift targetTonality out from under TransposeControls and loop.
    const currentUrlTonality = searchParams.get('tonality');
    const nextUrlTonality = option.isOriginal ? null : option.tonalityName;
    if (nextUrlTonality === currentUrlTonality) return;

    // Picking the original key (or "No Capo", which maps to it) means there's
    // no override to remember — drop it so Settings' reset count stays accurate.
    if (option.isOriginal) deleteSongTonalityPref(song.Name);
    else setSongTonalityPref(song.Name, option.tonalityName);

    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (nextUrlTonality) next.set('tonality', nextUrlTonality);
        else next.delete('tonality');
        return next;
      },
      { replace: true }
    );
  };

  // Capo is just another way to dial in the same tonality — picking "Capo
  // (+2)" is equivalent to picking the key that's 2 semitones up, and both
  // controls stay in sync by always deriving one from the other.
  const capo = wrapCapoSteps(transpose?.steps ?? 0);
  const handleCapoChange = (nextCapo: number) => {
    handleTransposeChange(getTransposeOptionForSteps(originalTonality, nextCapo));
  };

  return (
    <div className="p-2 py-4 will-change-transform" {...swipeHandlers}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">{song.Name || 'Untitled'}</h2>

          <div className="print:hidden flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Tonality:{' '}
              {transpose && !transpose.isOriginal ? (
                <>
                  <span className="line-through text-purple-600 dark:text-purple-400">
                    {song.Tonality || '-'}
                  </span>{' '}
                  <span className="font-semibold">{transpose.tonalityName}</span>
                </>
              ) : (
                <span className="font-semibold">{song.Tonality || '-'}</span>
              )}
            </span>
            <span className="text-xs text-orange-600">
              BPM: <span className="font-semibold">{song.BPM ?? '-'}</span>
            </span>

            <button
              type="button"
              title={pinned ? 'Unpin' : 'Pin to top'}
              onClick={() => togglePinOverride(song.Name, pinned)}
              className={cn(
                'p-1 hover:text-yellow-500 dark:hover:text-yellow-400',
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
                'p-1 hover:text-yellow-500 dark:hover:text-yellow-400',
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
                'flex items-center gap-1 p-1 hover:text-teal-600 dark:hover:text-teal-400',
                myGroups.length > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'
              )}
            >
              <Bookmark className="w-4 h-4" fill={myGroups.length > 0 ? 'currentColor' : 'none'} />
              {myGroups.length > 0 && (
                <span className="text-xs break-words">{myGroups.join(', ')}</span>
              )}
            </button>
          </div>
        </div>

        <div className="print:hidden flex items-center gap-2 shrink-0">
          {text && (
            <button
              type="button"
              title={isControlsOpen ? 'Hide display controls' : 'Show display controls'}
              onClick={() => setIsControlsOpen(!isControlsOpen)}
              className={cn(
                'h-9 w-9 shrink-0 flex items-center justify-center rounded',
                isControlsOpen
                  ? 'bg-blue-700 dark:bg-blue-600 text-white hover:bg-blue-800 dark:hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <SongOverflowMenu song={song} canEdit={canEdit} onEdit={() => openEditSong(song)} />
        </div>
      </div>

      {text && (
        <SongControlsPanel
          open={isControlsOpen}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          originalTonality={originalTonality}
          targetTonality={targetTonality}
          onTransposeChange={handleTransposeChange}
          capo={capo}
          onCapoChange={handleCapoChange}
          columnClass={columnClass}
          onColumnClassChange={setColumnClass}
          hideTextLine={hideTextLine}
          hideChordLine={hideChordLine}
          onToggleTextLine={() => setHideTextLine(!hideTextLine)}
          onToggleChordLine={() => setHideChordLine(!hideChordLine)}
          onOpenMetronome={onOpenMetronome}
          canPrint={Boolean(text)}
        />
      )}

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
