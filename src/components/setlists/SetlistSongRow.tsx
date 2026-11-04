import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        'flex items-center gap-1 transition-shadow',
        // No scale-* — Tailwind v4 compiles it to the native CSS `scale`
        // property, which composes with (multiplies) the inline
        // `transform: translateY()` useDragReorder sets during drag, so the
        // row would drift further from the pointer the farther it moved.
        // z-30, not z-10 — the sticky search/title bar above the list sits
        // at z-20, so a dragged row would otherwise scroll underneath it.
        isDragging && 'relative z-30 shadow-xl bg-white dark:bg-gray-900'
      )}
    >
      <button
        type="button"
        title={t('Drag to reorder')}
        onPointerDown={handleProps.onPointerDown}
        className={cn(
          'shrink-0 py-2.5 w-7 flex items-center justify-center text-gray-400 touch-none',
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
        // Looks like a plain position number at rest (no box) — hover hints
        // it's tappable, focus turns it into a proper boxed input. Keeps the
        // same editable <input type="number"> behavior (type a position,
        // Enter/blur commits via commitPosition), just without the heavy
        // bordered-box look sitting next to the ghost drag handle.
        className="shrink-0 w-8 py-2.5 text-center text-sm font-medium text-gray-500 dark:text-gray-400 rounded bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <div className="flex-1 min-w-0">
        <SwipeToDeleteRow onDelete={onRemoveFromSetlist}>
          <div
            role="button"
            tabIndex={0}
            title={song.Text ? '' : t('Text not available for this song')}
            onClick={() => onSelect(song)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(song);
              }
            }}
            className="w-full px-2 py-1 cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-1">
              <div className="flex-1 min-w-0 font-medium truncate">
                {song.Name || t('Untitled')}
              </div>
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
