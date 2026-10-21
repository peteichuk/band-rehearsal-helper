import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  applySongSettings,
  downloadSongSettingsAsFile,
  hasSongSettings,
  parseSongSettingsFile,
  songHasDataInFile,
  type ImportConflictChoice,
} from '@/lib/songSettingsTransfer';
import { SongImportConflictDialog } from '@/components/song-detail/SongImportConflictDialog';
import { showToast } from '@/lib/toast';

interface SongSettingsTransferButtonsProps {
  songName: string;
}

const buttonClass =
  'h-9 w-9 shrink-0 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';

/** Export/import just this one song's own local data (pin, tags, tonality, line notes, metronome preset, favorite status) — separate from the all-songs Settings → Backup flow. */
export function SongSettingsTransferButtons({ songName }: SongSettingsTransferButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingChoice, setPendingChoice] = useState<{
    resolve: (choice: ImportConflictChoice) => void;
  } | null>(null);

  const resolveConflict = (): Promise<ImportConflictChoice> =>
    new Promise(resolve => setPendingChoice({ resolve }));

  const handleExport = () => {
    if (!hasSongSettings(songName)) {
      showToast('Nothing saved locally for this song yet.', 'info');
      return;
    }
    downloadSongSettingsAsFile(songName);
  };

  const handleFileSelected = async (file: File) => {
    try {
      const parsed = await parseSongSettingsFile(file);
      // A file meant for a different song (or a bulk backup that just
      // doesn't mention this one) must never touch this song's local data
      // at all — checked before anything else, so Replace in particular
      // never gets a chance to clear this song's settings for nothing.
      if (!songHasDataInFile(parsed, songName)) {
        showToast('Nothing in that file for this song.', 'info');
        return;
      }
      // Only asks when there's actually something to conflict with —
      // nothing saved yet for this song just imports straight through.
      let mode: 'merge' | 'replace' = 'merge';
      if (hasSongSettings(songName)) {
        const choice = await resolveConflict();
        if (choice === 'cancel') {
          showToast('Import cancelled.', 'info');
          return;
        }
        mode = choice;
      }
      const imported = applySongSettings(songName, parsed, mode);
      showToast(`Imported: ${imported.join(', ')}.`, 'success');
    } catch (err) {
      showToast(`Import failed: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <>
      <button
        type="button"
        title="Import settings for this song"
        onClick={() => fileInputRef.current?.click()}
        className={buttonClass}
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Export this song's settings"
        onClick={handleExport}
        className={buttonClass}
      >
        <Upload className="w-4 h-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void handleFileSelected(file);
          event.target.value = '';
        }}
      />
      <SongImportConflictDialog
        songName={pendingChoice !== null ? songName : null}
        onChoice={choice => {
          pendingChoice?.resolve(choice);
          setPendingChoice(null);
        }}
      />
    </>
  );
}
