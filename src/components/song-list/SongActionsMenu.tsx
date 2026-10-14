import { useState } from 'react';
import { FolderPlus, MoreVertical, Pencil, Tag, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import { AlbumPickerDialog } from '@/components/shared/AlbumPickerDialog';
import type { Song } from '@/types/song';

interface SongActionsMenuProps {
  song: Song;
  canEdit: boolean;
  onEdit: () => void;
  albumContext?: {
    onRemoveFromAlbum: () => void;
  };
}

/** The "⋮" menu on a song row: edit, labels, add to album, and (inside an album) remove from it. */
export function SongActionsMenu({ song, canEdit, onEdit, albumContext }: SongActionsMenuProps) {
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="More options"
            onClick={event => event.stopPropagation()}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        {/*
          React bubbles a portaled Radix item's click along the *React* tree,
          not the DOM tree — so without this, selecting any item here would
          also fire the row's own onClick (select/navigate) underneath it.
        */}
        <DropdownMenuContent
          align="end"
          className="w-52"
          onClick={event => event.stopPropagation()}
        >
          {canEdit && (
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="w-4 h-4" />
              Edit song
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onSelect={() => setIsLabelsOpen(true)}>
            <Tag className="w-4 h-4" />
            Labels
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setIsAlbumPickerOpen(true)}>
            <FolderPlus className="w-4 h-4" />
            Add to album
          </DropdownMenuItem>

          {albumContext && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={albumContext.onRemoveFromAlbum}>
                <Trash2 className="w-4 h-4" />
                Remove
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/*
        Kept outside the trigger's own click handling so a click inside the
        portaled dialog content doesn't bubble up into the row's onClick.
      */}
      <div onClick={event => event.stopPropagation()}>
        <GroupEditorDialog
          open={isLabelsOpen}
          onOpenChange={setIsLabelsOpen}
          songName={song.Name}
        />
        <AlbumPickerDialog
          open={isAlbumPickerOpen}
          onOpenChange={setIsAlbumPickerOpen}
          songName={song.Name}
        />
      </div>
    </>
  );
}
