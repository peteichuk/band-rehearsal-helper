import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { SwipeToDeleteRow } from '@/components/shared/SwipeToDeleteRow';
import { SongActionsMenu } from '@/components/song-list/SongActionsMenu';
import { cn } from '@/lib/utils';
import type { PointerEventHandler } from 'react';
import type { Song } from '@/types/song';

interface SetlistSongRowProps {
  song: Song;
  position: number;
  totalCount: number;
  isDragging: boolean;
  rowRef: (el: HTMLElement | null) => void;
  handleProps: { onPointerDown: PointerEventHandler };
  onSelect: (song: Song) => void;
  onPositionCommit: (newPosition: number) => void;
  onRemoveFromSetlist: () => void;
  canEdit: boolean;
  onEdit: (song: Song) => void;
}

export function SetlistSongRow({
  song,
  position,
  totalCount,
  isDragging,
  rowRef,
  handleProps,
  onSelect,
  onPositionCommit,
  onRemoveFromSetlist,
  canEdit,
  onEdit,
}: SetlistSongRowProps) {
  const [positionInput, setPositionInput] = useState(String(position));

  useEffect(() => {
    setPositionInput(String(position));
  }, [position]);

  const commitPosition = () => {
    const parsed = Number(positionInput);
    if (!Number.isFinite(parsed)) {
      setPositionInput(String(position));
      return;
    }
    const clamped = Math.min(Math.max(1, Math.round(parsed)), totalCount);
    setPositionInput(String(clamped));
    if (clamped !== position) onPositionCommit(clamped);
  };

  return (
    <div
      ref={rowRef}
      className={cn(
        'flex items-center gap-1 mb-1 rounded transition-shadow',
        isDragging && 'relative z-10 shadow-xl scale-[1.02] bg-white dark:bg-gray-800'
      )}
    >
      <button
        type="button"
        title="Drag to reorder"
        onPointerDown={handleProps.onPointerDown}
        className={cn(
          'shrink-0 h-9 w-7 flex items-center justify-center text-gray-400 touch-none',
          isDragging ? 'cursor-grabbing text-blue-500' : 'cursor-grab'
        )}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <input
        type="number"
        min={1}
        max={totalCount}
        value={positionInput}
        onClick={event => event.stopPropagation()}
        onChange={event => setPositionInput(event.target.value)}
        onBlur={commitPosition}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitPosition();
          }
        }}
        className="shrink-0 w-10 h-9 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex-1 min-w-0">
        <SwipeToDeleteRow onDelete={onRemoveFromSetlist}>
          <div
            role="button"
            tabIndex={0}
            title={song.Text ? '' : 'Text not available for this song'}
            onClick={() => onSelect(song)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(song);
              }
            }}
            className="w-full px-2 py-1 rounded cursor-pointer bg-blue-100 dark:bg-gray-800 hover:bg-blue-300 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-1">
              <div className="flex-1 min-w-0 font-medium truncate">{song.Name || 'Untitled'}</div>
              {song.Tonality && (
                <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">
                  {song.Tonality}
                </span>
              )}
              {song.Language && (
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {song.Language}
                </span>
              )}
              <SongActionsMenu
                song={song}
                canEdit={canEdit}
                onEdit={() => onEdit(song)}
                setlistContext={{ onRemoveFromSetlist }}
              />
            </div>
          </div>
        </SwipeToDeleteRow>
      </div>
    </div>
  );
}
