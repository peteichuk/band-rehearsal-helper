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
}

export function SongList({ songs, selectedSong, onSelect, canEdit, onEdit }: SongListProps) {
  const { t } = useTranslation();
  if (songs.length === 0) {
    return <EmptyState title={t('No songs found')} />;
  }

  return (
    <div>
      {songs.map((song, index) => (
        <SongListItem
          key={`${song.Name}-${index}`}
          song={song}
          isSelected={selectedSong === song}
          onSelect={onSelect}
          canEdit={canEdit}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
