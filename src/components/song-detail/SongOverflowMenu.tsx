import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderPlus, MoreVertical, Pencil, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SongLinks, hasSongLinks } from '@/components/song-detail/SongLinks';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import { SetlistPickerDialog } from '@/components/shared/SetlistPickerDialog';
import type { Song } from '@/types/song';

interface SongOverflowMenuProps {
  song: Song;
  canEdit: boolean;
  onEdit: () => void;
}

/** The "⋮" menu for everything that doesn't need to stay on-screen while reading a song. */
export function SongOverflowMenu({ song, canEdit, onEdit }: SongOverflowMenuProps) {
  const { t } = useTranslation();
  const showLinks = hasSongLinks(song);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [isSetlistPickerOpen, setIsSetlistPickerOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={t('More options')}
            className="h-9 w-10 shrink-0 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showLinks && (
            <>
              <SongLinks song={song} />
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onSelect={() => setIsLabelsOpen(true)}>
            <Tag className="w-4 h-4" />
            {t('Labels')}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setIsSetlistPickerOpen(true)}>
            <FolderPlus className="w-4 h-4" />
            {t('Add to setlist')}
          </DropdownMenuItem>

          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="w-4 h-4" />
                {t('Edit song')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <GroupEditorDialog open={isLabelsOpen} onOpenChange={setIsLabelsOpen} songName={song.Name} />
      <SetlistPickerDialog
        open={isSetlistPickerOpen}
        onOpenChange={setIsSetlistPickerOpen}
        songName={song.Name}
      />
    </>
  );
}
