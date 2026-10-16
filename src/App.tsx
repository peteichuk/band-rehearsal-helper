import { useCallback, useMemo, useState } from 'react';
import {
  HashRouter,
  Outlet,
  Route,
  Routes,
  matchPath,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SongListPage } from '@/pages/SongListPage';
import { SongDetailPage } from '@/pages/SongDetailPage';
import { AlbumDetailPage } from '@/pages/AlbumDetailPage';
import { Header } from '@/components/layout/Header';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Loader } from '@/components/layout/Loader';
import { PullToRefreshIndicator } from '@/components/layout/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { MetronomeModal } from '@/components/metronome/MetronomeModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { SongFormDialog } from '@/components/song-form/SongFormDialog';
import { useSongsQuery } from '@/hooks/useSongsQuery';
import { useMetronome } from '@/hooks/useMetronome';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useEditAccess } from '@/hooks/useEditAccess';
import { extractSheetId } from '@/lib/google/sheetId';
import { useSheetTitle } from '@/hooks/useSheetTitle';
import { appendSong, updateSong } from '@/lib/google/sheetsWrite';
import { useEffectivePinsSet } from '@/hooks/useEffectivePins';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { MenuProvider, useSetMenuOpen } from '@/contexts/MenuContext';
import { sortForDisplay } from '@/lib/songs/sortAndFilter';
import { DEFAULT_PAGE_ACTIONS, type CatalogViewMode, type PageActions } from '@/types/pageActions';
import type { Song } from '@/types/song';

export interface RootOutletContext {
  allSongs: Song[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  tableId: string | null;
  setTableId: (tableId: string) => void;
  setPageActions: (actions: PageActions) => void;
  canEdit: boolean;
  openAddSong: () => void;
  openEditSong: (song: Song) => void;
  onOpenMetronome: () => void;
  isMetronomePlaying: boolean;
  catalogViewMode: CatalogViewMode;
  setCatalogViewMode: (mode: CatalogViewMode) => void;
}

function RootLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tableId = searchParams.get('tableId');
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isSuccess, isError, error, refetch } =
    useSongsQuery(tableId);
  const rawSongs = data?.songs ?? [];
  const effectivePinnedNames = useEffectivePinsSet(rawSongs);
  const allSongs = useMemo(
    () => sortForDisplay(rawSongs, effectivePinnedNames),
    [rawSongs, effectivePinnedNames]
  );
  const headers = data?.headers ?? [];

  // Derived straight from the route + allSongs (not from SongDetailPage's
  // pageActions, which lags a render behind on navigation) so the metronome
  // always gets the right song's BPM/TimeSignature the instant resetKey
  // changes on prev/next/swipe — no stale-then-corrected two-render race.
  const songRouteMatch = matchPath('/song/:songName', location.pathname);
  const currentSong = songRouteMatch
    ? (allSongs.find(
        candidate => candidate.Name === decodeURIComponent(songRouteMatch.params.songName ?? '')
      ) ?? null)
    : null;

  const auth = useGoogleAuth();
  const canEdit = useEditAccess(tableId, auth.accessToken);
  const { data: sheetTitle } = useSheetTitle(tableId, auth.accessToken, canEdit);

  const [pageActions, setPageActions] = useState<PageActions>(DEFAULT_PAGE_ACTIONS);
  const [catalogViewMode, setCatalogViewMode] = useLocalStorageState<CatalogViewMode>(
    'catalogViewMode',
    'list'
  );
  const metronome = useMetronome(location.pathname);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | 'new' | null>(null);
  const setMenuOpen = useSetMenuOpen();

  useDarkMode();
  useWakeLock();

  const handlePullToRefresh = useCallback(() => refetch(), [refetch]);
  // Drag-reorder/swipe-to-delete suppression lives inside usePullToRefresh
  // itself (a synchronous check against the interaction lock on every touch
  // event) rather than as a `disabled` prop here — see its comment for why.
  const pullToRefresh = usePullToRefresh<HTMLElement>({
    onRefresh: handlePullToRefresh,
    disabled: !tableId,
  });

  const setTableId = (next: string) => {
    const newId = extractSheetId(next);
    // Loading a new sheet while on a song/album detail page would otherwise
    // leave the URL pointing at content that no longer exists once the new
    // sheet's songs load — send the user back to the catalog instead.
    if (location.pathname !== '/') {
      const merged = new URLSearchParams(searchParams);
      merged.set('tableId', newId);
      setMenuOpen(false);
      setTimeout(() => {
        navigate(`/?${merged.toString()}`);
      }, 400);
      return;
    }
    setSearchParams(prev => {
      const merged = new URLSearchParams(prev);
      merged.set('tableId', newId);
      return merged;
    });
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    if (!tableId || !auth.accessToken || !sheetTitle) {
      throw new Error('Not ready to save yet — try again in a moment.');
    }
    if (editingSong === 'new') {
      await appendSong(tableId, auth.accessToken, sheetTitle, headers, values);
    } else if (editingSong) {
      await updateSong(
        tableId,
        auth.accessToken,
        sheetTitle,
        headers,
        editingSong._rowIndex,
        values
      );

      // Renaming the song currently open on its detail page would otherwise
      // leave the URL pointing at a name that no longer exists once the
      // list below refetches, so the page loses its song.
      const newName = String(values.Name ?? '');
      const oldPath = `/song/${encodeURIComponent(editingSong.Name)}`;
      if (newName && newName !== editingSong.Name && location.pathname === oldPath) {
        navigate(`/song/${encodeURIComponent(newName)}${location.search}`, { replace: true });
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['songs', tableId] });
  };

  const context: RootOutletContext = {
    allSongs,
    isLoading,
    isError,
    error,
    tableId,
    setTableId,
    setPageActions,
    canEdit,
    openAddSong: () => setEditingSong('new'),
    openEditSong: song => setEditingSong(song),
    onOpenMetronome: metronome.open,
    isMetronomePlaying,
    catalogViewMode,
    setCatalogViewMode,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        pageActions={pageActions}
        tableId={tableId}
        onTableIdChange={setTableId}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMetronome={metronome.open}
        isMetronomePlaying={isMetronomePlaying}
        isTableFetching={isFetching}
        isTableLoaded={isSuccess}
        auth={auth}
        canEdit={canEdit}
        onAddSong={() => setEditingSong('new')}
      />

      <main
        ref={pullToRefresh.containerRef}
        className="flex-1 overflow-y-auto overflow-x-clip relative"
      >
        <PullToRefreshIndicator
          pullDistance={pullToRefresh.pullDistance}
          isDragging={pullToRefresh.isDragging}
          isRefreshing={pullToRefresh.isRefreshing}
          threshold={pullToRefresh.threshold}
        />
        <div
          style={{
            transform: pullToRefresh.pullDistance
              ? `translateY(${pullToRefresh.pullDistance}px)`
              : undefined,
            transition: pullToRefresh.isDragging ? 'none' : 'transform 200ms ease-out',
          }}
        >
          <Outlet context={context} />
        </div>
      </main>

      <BottomTabBar
        value={catalogViewMode}
        onChange={setCatalogViewMode}
        visible={!pageActions.showBack}
      />

      <Loader visible={isLoading} />
      <MetronomeModal
        open={metronome.isOpen}
        onClose={metronome.close}
        hasOpenedOnce={metronome.hasOpenedOnce}
        resetKey={location.pathname}
        bpm={currentSong?.BPM ?? null}
        timeSignature={currentSong?.TimeSignature ?? null}
        onPlayingChange={setIsMetronomePlaying}
      />
      <ShareModal open={isShareOpen} onOpenChange={setIsShareOpen} title={pageActions.shareTitle} />
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <SongFormDialog
        open={editingSong !== null}
        onOpenChange={open => !open && setEditingSong(null)}
        headers={headers}
        initialSong={editingSong === 'new' ? null : editingSong}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

function App() {
  return (
    <MenuProvider>
      <HashRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<SongListPage />} />
            <Route path="/song/:songName" element={<SongDetailPage />} />
            <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </MenuProvider>
  );
}

export default App;
