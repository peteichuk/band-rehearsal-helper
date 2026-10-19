import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSongLineNotes } from '@/hooks/useSongLineNotes';

interface LineNotesPresetDialogProps {
  open: boolean;
  onClose: () => void;
  songName: string;
}

/**
 * Edits an existing note's text or removes it outright. Doesn't support
 * adding a brand new note — that's inherently tied to tapping a specific
 * lyric/chord line or section label on the song page itself, which this
 * out-of-context editor has no rendering of.
 */
export function LineNotesPresetDialog({ open, onClose, songName }: LineNotesPresetDialogProps) {
  const { notes, setNote, deleteNote } = useSongLineNotes(songName);
  const lineKeys = Object.keys(notes);

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-sm max-h-[70vh] flex flex-col overflow-hidden">
        <DialogTitle>Line notes — {songName}</DialogTitle>

        {lineKeys.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No notes left for this song.</p>
        ) : (
          <div className="min-h-0 space-y-2 overflow-y-auto">
            {lineKeys.map(lineKey => (
              <div key={lineKey} className="flex items-start gap-2">
                <textarea
                  value={notes[lineKey]}
                  onChange={event => setNote(lineKey, event.target.value)}
                  rows={2}
                  className="flex-1 resize-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteNote(lineKey)}
                  title="Delete this note"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
