import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocalGroups } from '@/hooks/useLocalGroups';
import { cn } from '@/lib/utils';

interface GroupEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songName: string | null;
}

export function GroupEditorDialog({ open, onOpenChange, songName }: GroupEditorDialogProps) {
  const { t } = useTranslation();
  const { getGroups, addGroup, removeGroup, allGroupNames } = useLocalGroups();
  const [input, setInput] = useState('');

  const currentGroups = songName ? getGroups(songName) : [];

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return allGroupNames
      .filter(name => !currentGroups.some(g => g.toLowerCase() === name.toLowerCase()))
      .filter(name => !q || name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allGroupNames, currentGroups, input]);

  const commitInput = () => {
    if (!songName) return;
    const clean = input.replace(/[\r\n]+/g, ' ').trim();
    if (!clean) return;
    addGroup(songName, clean);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-sm">
        <DialogTitle>
          {songName ? t('My groups — {{songName}}', { songName }) : t('My groups')}
        </DialogTitle>

        {currentGroups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentGroups.map(group => (
              <span
                key={group}
                className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-lg text-xs break-words"
              >
                {group}
                <button
                  type="button"
                  onClick={() => songName && removeGroup(songName, group)}
                  className="hover:text-destructive"
                  title={t('Remove "{{name}}"', { name: group })}
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
            placeholder={t('Add a group…')}
            // text-base (16px) is deliberate — iOS Safari auto-zooms the
            // page on focus for any input with a computed font-size under
            // 16px.
            className="w-full py-[7px] px-3 rounded text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {suggestions.length > 0 && (
            <ul className="mt-1 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded divide-y divide-gray-100 dark:divide-gray-700">
              {suggestions.map(name => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => {
                      if (songName) addGroup(songName, name);
                      setInput('');
                    }}
                    className={cn(
                      'w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <Button type="button" variant="outline" onClick={commitInput} disabled={!input.trim()}>
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
