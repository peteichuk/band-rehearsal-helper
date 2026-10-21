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
import { SetlistPickerDialog } from '@/components/shared/SetlistPickerDialog';
import type { Song } from '@/types/song';

interface SongActionsMenuProps {
  song: Song;
  canEdit: boolean;
  onEdit: () => void;
  setlistContext?: {
    onRemoveFromSetlist: () => void;
  };
}

/** The "⋮" menu on a song row: edit, labels, add to setlist, and (inside a setlist) remove from it. */
export function SongActionsMenu({ song, canEdit, onEdit, setlistContext }: SongActionsMenuProps) {
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [isSetlistPickerOpen, setIsSetlistPickerOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="More options"
            onClick={event => event.stopPropagation()}
            className="shrink-0 h-9 w-10 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
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

          <DropdownMenuItem onSelect={() => setIsSetlistPickerOpen(true)}>
            <FolderPlus className="w-4 h-4" />
            Add to setlist
          </DropdownMenuItem>

          {setlistContext && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={setlistContext.onRemoveFromSetlist}>
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
        <SetlistPickerDialog
          open={isSetlistPickerOpen}
          onOpenChange={setIsSetlistPickerOpen}
          songName={song.Name}
        />
      </div>
    </>
  );
}
