import { useSyncExternalStore } from 'react';
import {
  deleteSongLineNote,
  getSongLineNotes,
  setSongLineNote,
  subscribeSongLineNotes,
} from '@/lib/songLineNotes';

export function useSongLineNotes(songName: string) {
  const notes = useSyncExternalStore(subscribeSongLineNotes, () => getSongLineNotes(songName));

  return {
    notes,
    setNote: (lineKey: string, note: string) => setSongLineNote(songName, lineKey, note),
    deleteNote: (lineKey: string) => deleteSongLineNote(songName, lineKey),
  };
}
