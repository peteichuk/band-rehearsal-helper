import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck2, Pin, Star, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalFavorites } from '@/hooks/useLocalFavorites';
import { usePinOverrides } from '@/hooks/useEffectivePins';
import { useLocalGroups } from '@/hooks/useLocalGroups';
import { togglePinOverride } from '@/lib/localPins';
import { isEffectivelyPinned } from '@/lib/songs/effectivePins';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import { SongActionsMenu } from '@/components/song-list/SongActionsMenu';
import { HighlightedText } from '@/components/song-list/HighlightedText';
import { findMatchingLine } from '@/lib/songs/search';
import type { Song } from '@/types/song';

interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  onSelect: (song: Song) => void;
  canEdit: boolean;
  onEdit: (song: Song) => void;
  /** Active search query — when set, matching words in the name are highlighted. */
  highlightQuery?: string;
}

export function SongListItem({
  song,
  isSelected,
  onSelect,
  canEdit,
  onEdit,
  highlightQuery,
}: SongListItemProps) {
  const { t } = useTranslation();
  const hasText = Boolean(song.Text);
  const { isFavorite, toggleFavorite } = useLocalFavorites();
  const isLocalFavorite = isFavorite(song.Name);
  const pinOverrides = usePinOverrides();
  const isPinned = isEffectivelyPinned(song, pinOverrides);
  const { getGroups } = useLocalGroups();
  const myGroups = getGroups(song.Name);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  // Only looked up while actively searching — shows *why* a result matched
  // when it came from the lyrics rather than the name, which the row
  // otherwise gives no clue about.
  const matchingLine = highlightQuery ? findMatchingLine(song.Text, highlightQuery) : null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        title={hasText ? '' : t('Text not available for this song')}
        onClick={() => onSelect(song)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(song);
          }
        }}
        className={cn(
          'w-full px-2 py-1 border-l-4 transition-colors cursor-pointer',
          isSelected
            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-gray-700 text-blue-900 dark:text-blue-100'
            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/60'
        )}
      >
        <div className="flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1 mb-1">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    togglePinOverride(song.Name, isPinned);
                  }}
                  title={isPinned ? t('Unpin') : t('Pin to top')}
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
                  title={isLocalFavorite ? t('Remove from my favorites') : t('Add to my favorites')}
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
              </div>

              <div className="flex-1 min-w-0 font-medium flex w-full gap-2 items-start">
                <span
                  className={cn(
                    'flex flex-nowrap items-center gap-1',
                    !hasText && 'text-red-900 dark:text-red-300 underline decoration-wavy'
                  )}
                >
                  {song.Name ? (
                    <HighlightedText text={song.Name} query={highlightQuery ?? ''} />
                  ) : (
                    t('Untitled')
                  )}
                </span>
                {hasText && (
                  <span className="text-xs text-green-600 dark:text-green-700 mt-1">
                    <FileCheck2 className="w-4 h-4" />
                  </span>
                )}
                {song.Tonality && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {song.Tonality}
                  </span>
                )}
                {song.BPM != null && (
                  <span className="text-xs text-orange-600 mt-1">{song.BPM}</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  setIsGroupEditorOpen(true);
                }}
                title={myGroups.length > 0 ? t('Edit labels') : t('Add a label')}
                className={cn(
                  'inline-flex items-center gap-1 flex-wrap text-left text-xs px-0.5',
                  myGroups.length === 0 &&
                    'text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'
                )}
              >
                <Tag
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    myGroups.length > 0 && 'text-teal-500 dark:text-teal-700'
                  )}
                  fill={myGroups.length > 0 ? 'currentColor' : 'none'}
                />
                {myGroups.map(group => (
                  <span
                    key={group}
                    className="px-2 py-1 rounded-lg text-white bg-teal-500 dark:bg-teal-700"
                  >
                    <HighlightedText text={group} query={highlightQuery ?? ''} />
                  </span>
                ))}
              </button>
              {song.GroupBy && (
                <span className="inline-block w-fit px-2 py-1 text-xs text-white bg-purple-600 dark:bg-purple-900 rounded-lg">
                  <HighlightedText text={song.GroupBy} query={highlightQuery ?? ''} />
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-xs mt-1">
            {song.Language && (
              <span className="text-gray-500 dark:text-gray-400">
                <HighlightedText text={song.Language} query={highlightQuery ?? ''} />
              </span>
            )}
            <SongActionsMenu song={song} canEdit={canEdit} onEdit={() => onEdit(song)} />
          </div>
        </div>

        {matchingLine && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
            <HighlightedText text={matchingLine} query={highlightQuery ?? ''} />
          </p>
        )}
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
