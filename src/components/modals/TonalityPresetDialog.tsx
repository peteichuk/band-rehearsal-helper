import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TransposeControls } from '@/components/song-detail/TransposeControls';
import { CapoSelect } from '@/components/song-detail/CapoSelect';
import {
  getSongTonalityPref,
  setSongTonalityPref,
  deleteSongTonalityPref,
} from '@/lib/songKeyPrefs';
import {
  getTransposeOptionForSteps,
  wrapCapoSteps,
  type TransposeOption,
} from '@/lib/chords/transpose';
import type { Song } from '@/types/song';

interface TonalityPresetDialogProps {
  open: boolean;
  onClose: () => void;
  song: Song;
}

/** Same TransposeControls + CapoSelect pair the song page uses, wired directly to songKeyPrefs instead of the page's URL/nav state. */
export function TonalityPresetDialog({ open, onClose, song }: TonalityPresetDialogProps) {
  const originalTonality = song.Tonality || 'C';
  const storedPref = getSongTonalityPref(song.Name);
  const [transpose, setTranspose] = useState<TransposeOption | null>(null);

  const handleTransposeChange = (option: TransposeOption) => {
    setTranspose(option);

    const nextPref = option.isOriginal ? null : option.tonalityName;
    // TransposeControls fires this both for a real pick and for the restore
    // it does on mount — only act when it actually differs from what's
    // already stored, same guard SongDetailPage uses against its URL param.
    if (nextPref === storedPref) return;
    if (option.isOriginal) deleteSongTonalityPref(song.Name);
    else setSongTonalityPref(song.Name, option.tonalityName);
  };

  // Capo raises the pitch, so playing shapes for a LOWER key with a capo on
  // sounds like the original — same inverse relationship SongDetailPage uses.
  const capo = wrapCapoSteps(-(transpose?.steps ?? 0));
  const handleCapoChange = (nextCapo: number) => {
    handleTransposeChange(getTransposeOptionForSteps(originalTonality, -nextCapo));
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-sm">
        <DialogTitle>Tonality/Capo — {song.Name}</DialogTitle>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <TransposeControls
            originalTonality={originalTonality}
            targetTonality={storedPref}
            onTransposeChange={handleTransposeChange}
          />
          <CapoSelect value={capo} onChange={handleCapoChange} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
