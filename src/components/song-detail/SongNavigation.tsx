import type { SongNavigation as SongNavigationState } from '@/hooks/useSongNavigation';
import { numberedTitle } from '@/lib/songs/songNumber';
import type { Song } from '@/types/song';

interface SongNavigationProps {
  navigation: SongNavigationState;
  onNavigate: (song: Song) => void;
  /** Setlist positions (1-based) of the neighbours, for the "№3 Title" labels — null outside a setlist. */
  prevNumber?: number | null;
  nextNumber?: number | null;
  /** Setlist length, for the "/12" part of the label. */
  total?: number;
}

export function SongNavigation({
  navigation,
  onNavigate,
  prevNumber = null,
  nextNumber = null,
  total = 0,
}: SongNavigationProps) {
  const { prev, next } = navigation;
  if (!prev && !next) return null;

  return (
    <div className="flex justify-between items-center mt-4 gap-4">
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && onNavigate(prev)}
        className={
          'flex items-center gap-2 py-2 px-4 min-w-[90px] max-w-[46%] overflow-hidden rounded ' +
          (!prev
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-500 dark:hover:bg-blue-600 text-white')
        }
      >
        <span className="flex-shrink-0">&larr;</span>
        <span className="truncate">
          {prev ? numberedTitle(prev.Name, prevNumber, total) : '...'}
        </span>
      </button>

      <button
        type="button"
        disabled={!next}
        onClick={() => next && onNavigate(next)}
        className={
          'flex items-center gap-2 py-2 px-4 min-w-[90px] max-w-[46%] overflow-hidden rounded ' +
          (!next
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-500 dark:hover:bg-blue-600 text-white')
        }
      >
        <span className="truncate">
          {next ? numberedTitle(next.Name, nextNumber, total) : '...'}
        </span>
        <span className="flex-shrink-0">&rarr;</span>
      </button>
    </div>
  );
}
