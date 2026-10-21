import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SetlistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSubmit: (name: string) => void;
}

/** Create or rename a setlist — single name field. */
export function SetlistFormDialog({
  open,
  onOpenChange,
  initialName,
  onSubmit,
}: SetlistFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName ?? '');

  useEffect(() => {
    if (open) setName(initialName ?? '');
  }, [open, initialName]);

  const commit = () => {
    const clean = name.replace(/[\r\n]+/g, ' ').trim();
    if (!clean) return;
    onSubmit(clean);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{initialName ? t('Rename setlist') : t('New setlist')}</DialogTitle>

        <input
          type="text"
          autoFocus
          value={name}
          onChange={e => setName(e.target.value.replace(/[\r\n]+/g, ' '))}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={t('Setlist name…')}
          // text-base (16px), not the dialog's inherited text-sm (14px) —
          // iOS/Android auto-zoom the viewport on focusing any input under
          // 16px, and that zoom can stay stuck after the dialog closes.
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex justify-end mt-2">
          <Button type="button" onClick={commit} disabled={!name.trim()}>
            {initialName ? t('Save') : t('Create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
