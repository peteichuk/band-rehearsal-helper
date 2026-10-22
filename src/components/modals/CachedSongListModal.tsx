import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CachedSongListModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  songNames: string[];
  onSongClick: (songName: string) => void;
  /** Omit to hide the edit (pencil) action for a song — e.g. when its underlying song no longer exists. */
  onEdit?: (songName: string) => boolean | void;
  onRemove: (songName: string) => void;
  removeConfirmText: (songName: string) => string;
}

/**
 * Generic "which songs have this cached, and what to do about it" list,
 * reused across Settings' per-song categories (Pinned overrides, My groups,
 * Tonality/Capo, Line notes, Metronome presets) instead of one bespoke modal
 * per category.
 */
export function CachedSongListModal({
  open,
  onClose,
  title,
  songNames,
  onSongClick,
  onEdit,
  onRemove,
  removeConfirmText,
}: CachedSongListModalProps) {
  const { t } = useTranslation();
  const handleRemove = (songName: string) => {
    if (window.confirm(removeConfirmText(songName))) onRemove(songName);
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-sm max-h-[70vh] flex flex-col overflow-hidden">
        <DialogTitle>{title}</DialogTitle>

        {songNames.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Nothing cached yet.')}</p>
        ) : (
          <ul className="min-h-0 space-y-1 overflow-y-auto">
            {songNames.map(songName => (
              <li
                key={songName}
                className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={() => onSongClick(songName)}
                  className="min-w-0 flex-1 truncate text-left text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {songName}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {onEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(songName)}
                      title={t('Edit')}
                    >
                      <Pencil className="size-5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(songName)}
                    title={t('Remove from cache')}
                  >
                    <Trash2 className="size-5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
