import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocalSetlists } from '@/hooks/useLocalSetlists';
import { cn } from '@/lib/utils';
import type { Song } from '@/types/song';

interface SetlistSongPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setlistId: string;
  allSongs: Song[];
}

/** Bulk "add songs to this setlist" — the inverse of SetlistPickerDialog. */
export function SetlistSongPickerDialog({
  open,
  onOpenChange,
  setlistId,
  allSongs,
}: SetlistSongPickerDialogProps) {
  const { t } = useTranslation();
  const { getSetlist, addSongToSetlist, removeSongFromSetlist } = useLocalSetlists();
  const [query, setQuery] = useState('');

  const memberNames = new Set((getSetlist(setlistId)?.songs ?? []).map(entry => entry.songName));

  const visibleSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...allSongs].sort((a, b) => a.Name.localeCompare(b.Name));
    if (!q) return sorted;
    return sorted.filter(song => song.Name.toLowerCase().includes(q));
  }, [allSongs, query]);

  const toggle = (songName: string) => {
    if (memberNames.has(songName)) removeSongFromSetlist(setlistId, songName);
    else addSongToSetlist(setlistId, songName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{t('Add songs')}</DialogTitle>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('Search songs…')}
          // text-base (16px) is deliberate — iOS Safari auto-zooms the
          // page on focus for any input with a computed font-size under
          // 16px.
          className="w-full py-[7px] px-3 rounded text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {visibleSongs.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-400">{t('No songs found')}</li>
          )}
          {visibleSongs.map(song => {
            const isMember = memberNames.has(song.Name);
            return (
              <li key={song.Name}>
                <button
                  type="button"
                  onClick={() => toggle(song.Name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700',
                    isMember && 'text-teal-700 dark:text-teal-400'
                  )}
                >
                  <span className="flex-1 truncate">{song.Name || t('Untitled')}</span>
                  {isMember && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end mt-2">
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('Done')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
