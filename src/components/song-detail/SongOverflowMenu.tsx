import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FolderPlus, MoreVertical, Pencil, Tag, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SongLinks, hasSongLinks } from '@/components/song-detail/SongLinks';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import { SetlistPickerDialog } from '@/components/shared/SetlistPickerDialog';
import { SongImportConflictDialog } from '@/components/song-detail/SongImportConflictDialog';
import {
  applySongSettings,
  downloadSongSettingsAsFile,
  hasSongSettings,
  parseSongSettingsFile,
  songHasDataInFile,
  type ImportConflictChoice,
} from '@/lib/songSettingsTransfer';
import { showToast } from '@/lib/toast';
import type { Song } from '@/types/song';

interface SongOverflowMenuProps {
  song: Song;
  canEdit: boolean;
  onEdit: () => void;
}

/** The "⋮" menu for everything that doesn't need to stay on-screen while reading a song. */
export function SongOverflowMenu({ song, canEdit, onEdit }: SongOverflowMenuProps) {
  const { t } = useTranslation();
  const showLinks = hasSongLinks(song);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [isSetlistPickerOpen, setIsSetlistPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingChoice, setPendingChoice] = useState<{
    resolve: (choice: ImportConflictChoice) => void;
  } | null>(null);

  const resolveConflict = (): Promise<ImportConflictChoice> =>
    new Promise(resolve => setPendingChoice({ resolve }));

  const handleExportSettings = () => {
    if (!hasSongSettings(song.Name)) {
      showToast(t('Nothing saved locally for this song yet.'), 'info');
      return;
    }
    downloadSongSettingsAsFile(song.Name);
  };

  const handleSettingsFileSelected = async (file: File) => {
    try {
      const parsed = await parseSongSettingsFile(file);
      // A file meant for a different song (or a bulk backup that just
      // doesn't mention this one) must never touch this song's local data
      // at all — checked before anything else, so Replace in particular
      // never gets a chance to clear this song's settings for nothing.
      if (!songHasDataInFile(parsed, song.Name)) {
        showToast(t('Nothing in that file for this song.'), 'info');
        return;
      }
      // Only asks when there's actually something to conflict with —
      // nothing saved yet for this song just imports straight through.
      let mode: 'merge' | 'replace' = 'merge';
      if (hasSongSettings(song.Name)) {
        const choice = await resolveConflict();
        if (choice === 'cancel') {
          showToast(t('Import cancelled.'), 'info');
          return;
        }
        mode = choice;
      }
      const imported = applySongSettings(song.Name, parsed, mode);
      showToast(t('Imported: {{list}}.', { list: imported.join(', ') }), 'success');
    } catch (err) {
      showToast(t('Import failed: {{message}}', { message: (err as Error).message }), 'error');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={t('More options')}
            className="p-2.5 shrink-0 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showLinks && (
            <>
              <SongLinks song={song} />
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onSelect={() => setIsLabelsOpen(true)}>
            <Tag className="size-5" />
            {t('Labels')}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setIsSetlistPickerOpen(true)}>
            <FolderPlus className="size-5" />
            {t('Add to setlist')}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
            <Download className="size-5" />
            {t('Import settings for this song')}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleExportSettings}>
            <Upload className="size-5" />
            {t("Export this song's settings")}
          </DropdownMenuItem>

          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="size-5" />
                {t('Edit song')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void handleSettingsFileSelected(file);
          event.target.value = '';
        }}
      />

      <GroupEditorDialog open={isLabelsOpen} onOpenChange={setIsLabelsOpen} songName={song.Name} />
      <SetlistPickerDialog
        open={isSetlistPickerOpen}
        onOpenChange={setIsSetlistPickerOpen}
        songName={song.Name}
      />
      <SongImportConflictDialog
        songName={pendingChoice !== null ? song.Name : null}
        onChoice={choice => {
          pendingChoice?.resolve(choice);
          setPendingChoice(null);
        }}
      />
    </>
  );
}
