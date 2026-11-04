import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/EmptyState';
import { SongListItem } from '@/components/song-list/SongListItem';
import type { Song } from '@/types/song';

interface SongListProps {
  songs: Song[];
  selectedSong: Song | null;
  onSelect: (song: Song) => void;
  canEdit: boolean;
  onEdit: (song: Song) => void;
  /** Active search query — when set, matching words in each song's name are highlighted. */
  highlightQuery?: string;
}

export function SongList({
  songs,
  selectedSong,
  onSelect,
  canEdit,
  onEdit,
  highlightQuery,
}: SongListProps) {
  const { t } = useTranslation();
  if (songs.length === 0) {
    return <EmptyState title={t('No songs found')} />;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {songs.map((song, index) => (
        <SongListItem
          key={`${song.Name}-${index}`}
          song={song}
          isSelected={selectedSong === song}
          onSelect={onSelect}
          canEdit={canEdit}
          onEdit={onEdit}
          highlightQuery={highlightQuery}
        />
      ))}
    </div>
  );
}
