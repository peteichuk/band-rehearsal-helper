import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocalSetlists } from '@/hooks/useLocalSetlists';
import { cn } from '@/lib/utils';

interface SetlistPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songName: string | null;
}

/** Per-song "which setlists is this in" — same chips + search-suggestions UI as GroupEditorDialog. */
export function SetlistPickerDialog({ open, onOpenChange, songName }: SetlistPickerDialogProps) {
  const { t } = useTranslation();
  const {
    allSetlists,
    getSetlistsForSong,
    addSongToSetlist,
    removeSongFromSetlist,
    createSetlist,
  } = useLocalSetlists();
  const [input, setInput] = useState('');

  const currentSetlists = songName ? getSetlistsForSong(songName) : [];

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return allSetlists
      .filter(setlist => !currentSetlists.some(current => current.id === setlist.id))
      .filter(setlist => !q || setlist.name.toLowerCase().includes(q))
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSetlists, currentSetlists, input]);

  const commitInput = () => {
    if (!songName) return;
    const clean = input.replace(/[\r\n]+/g, ' ').trim();
    if (!clean) return;
    // Reuse an existing setlist's exact spelling case-insensitively, same as
    // addSongGroup does for labels — avoids "Acoustic" and "acoustic" forking.
    const existing = allSetlists.find(
      setlist => setlist.name.toLowerCase() === clean.toLowerCase()
    );
    const setlist = existing ?? createSetlist(clean);
    addSongToSetlist(setlist.id, songName);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>
          {songName ? t('Setlists — {{songName}}', { songName }) : t('Setlists')}
        </DialogTitle>

        {currentSetlists.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentSetlists.map(setlist => (
              <span
                key={setlist.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-lg text-xs break-words"
              >
                {setlist.name}
                <button
                  type="button"
                  onClick={() => songName && removeSongFromSetlist(setlist.id, songName)}
                  className="hover:text-destructive"
                  title={t('Remove from "{{name}}"', { name: setlist.name })}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.replace(/[\r\n]+/g, ' '))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitInput();
              }
            }}
            placeholder={t('Add a setlist…')}
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {suggestions.length > 0 && (
            <ul className="mt-1 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded divide-y divide-gray-100 dark:divide-gray-700">
              {suggestions.map(setlist => (
                <li key={setlist.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (songName) addSongToSetlist(setlist.id, songName);
                      setInput('');
                    }}
                    className={cn(
                      'w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {setlist.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={commitInput}
            disabled={!input.trim()}
          >
            {t('Add "{{value}}"', { value: input.trim() || '…' })}
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('Done')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
