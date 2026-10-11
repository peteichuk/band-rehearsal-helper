import { MoreVertical, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SongLinks, hasSongLinks } from '@/components/song-detail/SongLinks';
import type { Song } from '@/types/song';

interface SongOverflowMenuProps {
  song: Song;
  canEdit: boolean;
  onEdit: () => void;
}

/** The "⋮" menu for everything that doesn't need to stay on-screen while reading a song. */
export function SongOverflowMenu({ song, canEdit, onEdit }: SongOverflowMenuProps) {
  const showLinks = hasSongLinks(song);
  if (!showLinks && !canEdit) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="More options"
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {showLinks && (
          <>
            <SongLinks song={song} />
            {canEdit && <DropdownMenuSeparator />}
          </>
        )}

        {canEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="w-4 h-4" />
            Edit song
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
