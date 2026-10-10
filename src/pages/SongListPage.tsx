import { useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { TableIdPrompt } from '@/components/song-list/TableIdPrompt';
import { SearchBar } from '@/components/song-list/SearchBar';
import { GroupFilterSelect } from '@/components/song-list/GroupFilterSelect';
import { LanguageFilterSelect } from '@/components/song-list/LanguageFilterSelect';
import { SongList } from '@/components/song-list/SongList';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSongListContext } from '@/hooks/useSongListContext';
import { DEFAULT_PAGE_ACTIONS } from '@/types/pageActions';
import { getListScrollTop, saveListScrollTop } from '@/lib/scrollMemory';
import type { RootOutletContext } from '@/App';
import type { Song } from '@/types/song';

export function SongListPage() {
  const { allSongs, isLoading, isError, error, tableId, setTableId, setPageActions } =
    useOutletContext<RootOutletContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setPageActions(DEFAULT_PAGE_ACTIONS);
  }, [setPageActions]);

  // Restore wherever the list was scrolled to before a song was opened.
  useEffect(() => {
    window.scrollTo({ top: getListScrollTop() });
  }, []);

  const list = (searchParams.get('list') as 'search' | 'group' | null) ?? 'all';
  const q = searchParams.get('q') ?? '';
  const group = searchParams.get('group');
  const languagesParam = searchParams.get('languages') ?? '';
  const languages = languagesParam ? languagesParam.split(',') : [];

  const visibleSongs = useSongListContext(allSongs, { list, q, group, languages });

  const selectSong = (song: Song) => {
    saveListScrollTop(window.scrollY);
    const next = new URLSearchParams(searchParams);
    navigate(`/song/${encodeURIComponent(song.Name)}?${next.toString()}`);
  };

  if (!tableId) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <TableIdPrompt initialValue="" onLoad={setTableId} />
        </div>
        <EmptyState
          title="No table ID provided"
          message="Please enter a Google Sheets ID or URL to load songs."
        />
      </div>
    );
  }

  return (
    <div className="p-2 py-4 space-y-2">
      <div className="mb-2 space-y-2">
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
        <div className="flex flex-wrap gap-2">
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
      </div>

      {isLoading && <p className="text-center py-4">Loading…</p>}
      {isError && <p className="text-center py-4 text-destructive">Error: {String(error)}</p>}

      {!isLoading && !isError && (
        <SongList songs={visibleSongs} selectedSong={null} onSelect={selectSong} />
      )}
    </div>
  );
}
