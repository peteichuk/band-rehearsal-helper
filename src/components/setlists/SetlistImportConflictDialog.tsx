import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ImportConflictChoice = 'cancel' | 'merge' | 'replace';

interface SetlistImportConflictDialogProps {
  setlistName: string | null;
  onChoice: (choice: ImportConflictChoice, applyToAll: boolean) => void;
}

/**
 * Shown when an imported setlist's name collides with one already on this
 * device — in place of window.confirm, since a plain OK/Cancel can't offer
 * "merge" alongside "replace". "Apply for all" lets one answer resolve
 * every remaining collision in this same import instead of asking per name.
 */
export function SetlistImportConflictDialog({
  setlistName,
  onChoice,
}: SetlistImportConflictDialogProps) {
  const { t } = useTranslation();
  const [applyToAll, setApplyToAll] = useState(true);

  // Defaults back to checked for every new collision shown, rather than
  // remembering whatever the previous one (or a past import run) left it at.
  useEffect(() => {
    if (setlistName !== null) setApplyToAll(true);
  }, [setlistName]);

  return (
    <Dialog open={setlistName !== null} onOpenChange={open => !open && onChoice('cancel', false)}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{t('Setlist already exists')}</DialogTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t(
            'A setlist named "{{setlistName}}" already exists. Merge adds the imported songs into it; replace overwrites it completely.',
            { setlistName }
          )}
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={e => setApplyToAll(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          {t('Apply for all')}
        </label>
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="outline" onClick={() => onChoice('cancel', applyToAll)}>
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={() => onChoice('merge', applyToAll)}>
            {t('Merge')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onChoice('replace', applyToAll)}
          >
            {t('Replace')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
