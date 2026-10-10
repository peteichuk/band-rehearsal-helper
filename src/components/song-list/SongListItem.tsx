import { useState } from 'react';
import { Bookmark, FileCheck2, Pin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalFavorites } from '@/hooks/useLocalFavorites';
import { usePinOverrides } from '@/hooks/useEffectivePins';
import { useLocalGroups } from '@/hooks/useLocalGroups';
import { togglePinOverride } from '@/lib/localPins';
import { isEffectivelyPinned } from '@/lib/songs/effectivePins';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import type { Song } from '@/types/song';

interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  onSelect: (song: Song) => void;
}

export function SongListItem({ song, isSelected, onSelect }: SongListItemProps) {
  const hasText = Boolean(song.Text);
  const { isFavorite, toggleFavorite } = useLocalFavorites();
  const isLocalFavorite = isFavorite(song.Name);
  const pinOverrides = usePinOverrides();
  const isPinned = isEffectivelyPinned(song, pinOverrides);
  const { getGroups } = useLocalGroups();
  const myGroups = getGroups(song.Name);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        title={hasText ? '' : 'Text not available for this song'}
        onClick={() => onSelect(song)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(song);
          }
        }}
        className={cn(
          'w-full px-2 py-1 mb-1 rounded cursor-pointer hover:bg-blue-300 dark:hover:bg-gray-700 transition-colors',
          isSelected
            ? 'bg-blue-300 dark:bg-gray-700 text-blue-900 dark:text-blue-100'
            : 'bg-blue-100 dark:bg-gray-800'
        )}
      >
        <div className="flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  togglePinOverride(song.Name, isPinned);
                }}
                title={isPinned ? 'Unpin' : 'Pin to top'}
                className="shrink-0 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400"
              >
                <Pin
                  className={cn('w-4 h-4', isPinned && 'text-yellow-500 dark:text-yellow-400')}
                  fill={isPinned ? 'currentColor' : 'none'}
                />
              </button>

              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  toggleFavorite(song.Name);
                }}
                title={isLocalFavorite ? 'Remove from my favorites' : 'Add to my favorites'}
                className="shrink-0 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400"
              >
                <Star
                  className={cn(
                    'w-5 h-5',
                    isLocalFavorite && 'text-yellow-500 dark:text-yellow-400'
                  )}
                  fill={isLocalFavorite ? 'currentColor' : 'none'}
                />
              </button>

              <div className="flex-1 min-w-0 font-medium flex w-full gap-2 items-center">
                <span
                  className={cn(
                    'flex flex-nowrap items-center gap-1',
                    !hasText && 'text-red-900 dark:text-red-300 underline decoration-wavy'
                  )}
                >
                  {song.Name || 'Untitled'}
                  {hasText && (
                    <span className="text-xs text-green-600 dark:text-green-700">
                      <FileCheck2 className="w-4 h-4" />
                    </span>
                  )}
                </span>
                {song.Tonality && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">{song.Tonality}</span>
                )}
                {song.BPM != null && <span className="text-xs text-orange-600">{song.BPM}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setIsGroupEditorOpen(true);
              }}
              title={myGroups.length > 0 ? 'Edit my groups' : 'Add to a group'}
              className={cn(
                'self-start inline-flex items-start gap-1 text-left text-xs px-0.5',
                myGroups.length > 0
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'
              )}
            >
              <Bookmark
                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                fill={myGroups.length > 0 ? 'currentColor' : 'none'}
              />
              {myGroups.length > 0 && <span className="break-words">{myGroups.join(', ')}</span>}
            </button>
          </div>
          {(song.GroupBy || song.Language) && (
            <div className="shrink-0 flex items-center gap-1 text-xs mt-2">
              {song.GroupBy && (
                <span className="px-2 py-1 bg-purple-300 dark:bg-purple-900 rounded-lg">
                  {song.GroupBy}
                </span>
              )}
              {song.Language && (
                <span className="text-gray-500 dark:text-gray-400">{song.Language}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/*
        React bubbles synthetic events along the component tree, not the real
        DOM — so even though Radix portals the dialog's actual nodes out to
        document.body, a click inside it would still reach the card's onClick
        above unless we stop it here. Kept outside the card so it doesn't
        contribute an empty flex child to the card's own layout/spacing.
      */}
      <div onClick={event => event.stopPropagation()}>
        <GroupEditorDialog
          open={isGroupEditorOpen}
          onOpenChange={setIsGroupEditorOpen}
          songName={song.Name}
        />
      </div>
    </>
  );
}
