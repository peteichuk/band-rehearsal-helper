import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocalAlbums } from '@/hooks/useLocalAlbums';
import { cn } from '@/lib/utils';

interface AlbumPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songName: string | null;
}

/** Per-song "which albums is this in" — same chips + search-suggestions UI as GroupEditorDialog. */
export function AlbumPickerDialog({ open, onOpenChange, songName }: AlbumPickerDialogProps) {
  const { allAlbums, getAlbumsForSong, addSongToAlbum, removeSongFromAlbum, createAlbum } =
    useLocalAlbums();
  const [input, setInput] = useState('');

  const currentAlbums = songName ? getAlbumsForSong(songName) : [];

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return allAlbums
      .filter(album => !currentAlbums.some(current => current.id === album.id))
      .filter(album => !q || album.name.toLowerCase().includes(q))
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAlbums, currentAlbums, input]);

  const commitInput = () => {
    if (!songName) return;
    const clean = input.replace(/[\r\n]+/g, ' ').trim();
    if (!clean) return;
    // Reuse an existing album's exact spelling case-insensitively, same as
    // addSongGroup does for labels — avoids "Acoustic" and "acoustic" forking.
    const existing = allAlbums.find(album => album.name.toLowerCase() === clean.toLowerCase());
    const album = existing ?? createAlbum(clean);
    addSongToAlbum(album.id, songName);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Albums {songName ? `— ${songName}` : ''}</DialogTitle>

        {currentAlbums.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentAlbums.map(album => (
              <span
                key={album.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-lg text-xs break-words"
              >
                {album.name}
                <button
                  type="button"
                  onClick={() => songName && removeSongFromAlbum(album.id, songName)}
                  className="hover:text-destructive"
                  title={`Remove from "${album.name}"`}
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
            placeholder="Add an album…"
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {suggestions.length > 0 && (
            <ul className="mt-1 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded divide-y divide-gray-100 dark:divide-gray-700">
              {suggestions.map(album => (
                <li key={album.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (songName) addSongToAlbum(album.id, songName);
                      setInput('');
                    }}
                    className={cn(
                      'w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {album.name}
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
            Add "{input.trim() || '…'}"
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
