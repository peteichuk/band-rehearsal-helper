import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { TableIdPrompt } from '@/components/song-list/TableIdPrompt';
import { TableIdHelp } from '@/components/song-list/TableIdHelp';
import { SearchBar } from '@/components/song-list/SearchBar';
import { GroupFilterSelect } from '@/components/song-list/GroupFilterSelect';
import { LanguageFilterSelect } from '@/components/song-list/LanguageFilterSelect';
import { SongList } from '@/components/song-list/SongList';
import { SetlistsView } from '@/components/setlists/SetlistsView';
import { EmptyState } from '@/components/shared/EmptyState';
import { CollapsiblePanel } from '@/components/shared/CollapsiblePanel';
import { ScrollToTopButton } from '@/components/shared/ScrollToTopButton';
import { useSongListContext } from '@/hooks/useSongListContext';
import { DEFAULT_PAGE_ACTIONS } from '@/types/pageActions';
import { getListScrollTop, getSetlistsScrollTop, saveListScrollTop } from '@/lib/scrollMemory';
import { applySongTonalityToParams } from '@/lib/songKeyPrefs';
import { cn } from '@/lib/utils';
import type { RootOutletContext } from '@/App';
import type { Song } from '@/types/song';

export function SongListPage() {
  const { t } = useTranslation();
  const {
    allSongs,
    isLoading,
    isError,
    error,
    tableId,
    setTableId,
    setPageActions,
    canEdit,
    openEditSong,
    catalogViewMode,
  } = useOutletContext<RootOutletContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setPageActions(DEFAULT_PAGE_ACTIONS);
  }, [setPageActions]);

  // Restore wherever the list was scrolled to before leaving it — the song
  // library and the setlists tab each keep their own independent memory
  // (see scrollMemory.ts), picked by whichever tab is active on this mount.
  useEffect(() => {
    window.scrollTo({
      top: catalogViewMode === 'setlists' ? getSetlistsScrollTop() : getListScrollTop(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = (searchParams.get('list') as 'search' | 'group' | null) ?? 'all';
  const q = searchParams.get('q') ?? '';
  const group = searchParams.get('group');
  const languagesParam = searchParams.get('languages') ?? '';
  const languages = languagesParam ? languagesParam.split(',') : [];
  const hasActiveFilters = Boolean(group || languages.length > 0);

  // Starts open when a shared link already carries a group/language filter,
  // collapsed otherwise — the whole point is to not take up space by default.
  const [isFiltersOpen, setIsFiltersOpen] = useState(hasActiveFilters);

  const visibleSongs = useSongListContext(allSongs, { list, q, group, languages });

  const selectSong = (song: Song) => {
    saveListScrollTop(window.scrollY);
    const next = applySongTonalityToParams(searchParams, song.Name);
    navigate(`/song/${encodeURIComponent(song.Name)}?${next.toString()}`, {
      state: { fromAppNav: true },
    });
  };

  if (!tableId) {
    return (
      <div className="p-4 pb-24">
        <div className="mb-4 flex justify-center">
          <TableIdPrompt initialValue="" onLoad={setTableId} loading={isLoading} />
        </div>
        <EmptyState
          title={t('No table ID provided')}
          message={t('Please enter a Google Sheets ID or URL to load songs.')}
        />
        <TableIdHelp />
      </div>
    );
  }

  return (
    <div className="p-2 py-4 pb-24 space-y-2">
      {/*
        Keyed on the view mode so switching Library/Setlists remounts this
        wrapper and replays the entrance animation — a lightweight "content
        switch" effect to match the bottom tab bar driving it. Slide
        direction mirrors each tab's side (Library left, Setlists right).
      */}
      <div
        key={catalogViewMode}
        className={cn(
          'animate-in fade-in duration-200',
          catalogViewMode === 'setlists' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
        )}
      >
        {catalogViewMode === 'setlists' ? (
          <>
            {isLoading && <p className="text-center py-4">{t('Loading…')}</p>}
            {isError && (
              <p className="text-center py-4 text-destructive">
                {t('Error: {{message}}', { message: String(error) })}
              </p>
            )}
            {!isLoading && !isError && <SetlistsView allSongs={allSongs} />}
          </>
        ) : (
          <>
            <div className="sticky top-14 z-20 -mx-2 px-2 bg-white dark:bg-gray-900 pt-2 pb-2 mb-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchBar
                    value={q}
                    disabled={isLoading || allSongs.length === 0}
                    onChange={value => {
                      setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        if (value) {
                          next.set('list', 'search');
                          next.set('q', value);
                          next.delete('group');
                          next.delete('languages');
                        } else {
                          next.delete('list');
                          next.delete('q');
                        }
                        return next;
                      });
                    }}
                  />
                </div>

                <button
                  type="button"
                  title={isFiltersOpen ? t('Hide filters') : t('Show filters')}
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className={cn(
                    'p-2.5 shrink-0 flex items-center justify-center rounded border',
                    isFiltersOpen || hasActiveFilters
                      ? 'bg-blue-700 dark:bg-blue-600 text-white border-transparent hover:bg-blue-800 dark:hover:bg-blue-700'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-muted dark:hover:bg-input/50'
                  )}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              <CollapsiblePanel open={isFiltersOpen}>
                <div className="flex flex-wrap gap-2 pt-1">
                  <GroupFilterSelect
                    songs={allSongs}
                    value={group}
                    onChange={value => {
                      setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        if (value) {
                          next.set('list', 'group');
                          next.set('group', value);
                          next.delete('q');
                        } else {
                          next.delete('list');
                          next.delete('group');
                        }
                        return next;
                      });
                    }}
                  />
                  <LanguageFilterSelect
                    songs={allSongs}
                    value={languages}
                    onChange={next => {
                      setSearchParams(prev => {
                        const merged = new URLSearchParams(prev);
                        if (next.length > 0) merged.set('languages', next.join(','));
                        else merged.delete('languages');
                        return merged;
                      });
                    }}
                  />
                </div>
              </CollapsiblePanel>
            </div>

            {isLoading && <p className="text-center py-4">{t('Loading…')}</p>}
            {isError && (
              <p className="text-center py-4 text-destructive">
                {t('Error: {{message}}', { message: String(error) })}
              </p>
            )}

            {!isLoading && !isError && (
              <SongList
                songs={visibleSongs}
                selectedSong={null}
                onSelect={selectSong}
                canEdit={canEdit}
                onEdit={openEditSong}
                highlightQuery={list === 'search' ? q : ''}
              />
            )}

            <ScrollToTopButton />
          </>
        )}
      </div>
    </div>
  );
}
