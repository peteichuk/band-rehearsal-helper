import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AlbumFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSubmit: (name: string) => void;
}

/** Create or rename an album — single name field. */
export function AlbumFormDialog({
  open,
  onOpenChange,
  initialName,
  onSubmit,
}: AlbumFormDialogProps) {
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
        <DialogTitle>{initialName ? 'Rename album' : 'New album'}</DialogTitle>

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
          placeholder="Album name…"
          // text-base (16px), not the dialog's inherited text-sm (14px) —
          // iOS/Android auto-zoom the viewport on focusing any input under
          // 16px, and that zoom can stay stuck after the dialog closes.
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex justify-end mt-2">
          <Button type="button" onClick={commit} disabled={!name.trim()}>
            {initialName ? 'Save' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
