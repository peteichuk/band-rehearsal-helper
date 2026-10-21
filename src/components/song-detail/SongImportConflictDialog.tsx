import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ImportConflictChoice } from '@/lib/songSettingsTransfer';

interface SongImportConflictDialogProps {
  /** Null when closed — also what names the song in the dialog's own copy, so it's never ambiguous which song Replace is about to wipe. */
  songName: string | null;
  onChoice: (choice: ImportConflictChoice) => void;
}

/**
 * Shown only when this song already has some local data saved (see
 * hasSongSettings) — in place of a plain window.confirm, since that can't
 * offer "merge" alongside "replace". Mirrors SetlistImportConflictDialog,
 * minus "apply to all" (there's only ever one song here, nothing else to
 * apply it to).
 */
export function SongImportConflictDialog({ songName, onChoice }: SongImportConflictDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={songName !== null} onOpenChange={next => !next && onChoice('cancel')}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{t('"{{songName}}" already has local settings', { songName })}</DialogTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t(
            'Merge keeps what\'s already saved for "{{songName}}" and layers the imported values on top, overwriting only where both have the same thing. Replace discards "{{songName}}"\'s current local settings entirely and uses only what\'s in the file.',
            { songName }
          )}
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="outline" onClick={() => onChoice('cancel')}>
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={() => onChoice('merge')}>
            {t('Merge')}
          </Button>
          <Button type="button" variant="destructive" onClick={() => onChoice('replace')}>
            {t('Replace')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
