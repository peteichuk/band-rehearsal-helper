import { useRef, useState, useSyncExternalStore } from 'react';
import { Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SettingsAppearanceSection } from '@/components/modals/SettingsAppearanceSection';
import {
  getLocalFavorites,
  resetLocalFavorites,
  setLocalFavorites,
  subscribeLocalFavorites,
  getLocalFavoritesSnapshot,
} from '@/lib/localFavorites';
import {
  getPinOverrides,
  resetPinOverrides,
  setPinOverrides,
  subscribePinOverrides,
  getPinOverridesSnapshot,
  type PinOverrides,
} from '@/lib/localPins';
import {
  getAllLocalGroups,
  resetLocalGroups,
  setAllLocalGroups,
  subscribeLocalGroups,
  getLocalGroupsSnapshot,
  type LocalGroups,
} from '@/lib/localGroups';
import {
  getAllSongTonalityPrefs,
  mergeSongTonalityPrefs,
  resetSongTonalityPrefs,
  subscribeSongTonalityPrefs,
  getSongTonalityPrefsSnapshot,
} from '@/lib/songKeyPrefs';
import {
  mergeSongLineNotes,
  resetSongLineNotes,
  subscribeSongLineNotes,
  getSongLineNotesSnapshot,
} from '@/lib/songLineNotes';
import {
  getAllAlbums,
  mergeImportedAlbums,
  subscribeLocalAlbums,
  getLocalAlbumsSnapshot,
  type AlbumSongEntry,
} from '@/lib/localAlbums';
import {
  getAllGlobalDefaults,
  mergeGlobalDefaults,
  subscribeSongDisplayConfig,
  getSongDisplayConfigSnapshot,
  type Orientation,
  type OrientationDisplayConfig,
} from '@/lib/songDisplayConfig';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AppearanceDefaults = Record<Orientation, OrientationDisplayConfig>;
type ExportedAlbum = { name: string; songs: AlbumSongEntry[] };

interface ExportedSettings {
  version: 2;
  exportedAt: string;
  favorites?: string[];
  pinOverrides?: PinOverrides;
  customGroups?: LocalGroups;
  tonalityPrefs?: Record<string, string>;
  lineNotes?: Record<string, Record<string, string>>;
  albums?: ExportedAlbum[];
  appearanceDefaults?: AppearanceDefaults;
}

type BackupCategory =
  | 'favorites'
  | 'pins'
  | 'tags'
  | 'tonality'
  | 'lineNotes'
  | 'albums'
  | 'appearance';

const BACKUP_CATEGORIES: { key: BackupCategory; label: string }[] = [
  { key: 'favorites', label: 'Favorites' },
  { key: 'pins', label: 'Pinned overrides' },
  { key: 'tags', label: 'Tags (groups)' },
  { key: 'tonality', label: 'Tonality/Capo choices' },
  { key: 'lineNotes', label: 'Line/label notes' },
  { key: 'albums', label: 'Albums' },
  { key: 'appearance', label: 'Appearance settings' },
];

function selectionOf(value: boolean): Record<BackupCategory, boolean> {
  return Object.fromEntries(BACKUP_CATEGORIES.map(c => [c.key, value])) as Record<
    BackupCategory,
    boolean
  >;
}

/** Which categories a parsed file actually has data for — drives which import toggles are even selectable. */
function presentCategoriesOf(parsed: Partial<ExportedSettings>): Record<BackupCategory, boolean> {
  return {
    favorites: Array.isArray(parsed.favorites),
    pins: Boolean(parsed.pinOverrides && typeof parsed.pinOverrides === 'object'),
    tags: Boolean(parsed.customGroups && typeof parsed.customGroups === 'object'),
    tonality: Boolean(parsed.tonalityPrefs && typeof parsed.tonalityPrefs === 'object'),
    lineNotes: Boolean(parsed.lineNotes && typeof parsed.lineNotes === 'object'),
    albums: Array.isArray(parsed.albums),
    appearance: Boolean(parsed.appearanceDefaults),
  };
}

type BackupStep =
  | { kind: 'idle' }
  | { kind: 'export'; selection: Record<BackupCategory, boolean> }
  | {
      kind: 'import';
      parsed: Partial<ExportedSettings>;
      present: Record<BackupCategory, boolean>;
      selection: Record<BackupCategory, boolean>;
    };

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const favorites = useSyncExternalStore(subscribeLocalFavorites, getLocalFavoritesSnapshot);
  const pinOverrides = useSyncExternalStore(subscribePinOverrides, getPinOverridesSnapshot);
  const pinOverrideCount = Object.keys(pinOverrides).length;
  const customGroups = useSyncExternalStore(subscribeLocalGroups, getLocalGroupsSnapshot);
  const customGroupedSongsCount = Object.keys(customGroups).length;
  const tonalityPrefs = useSyncExternalStore(
    subscribeSongTonalityPrefs,
    getSongTonalityPrefsSnapshot
  );
  const tonalityPrefCount = Object.keys(tonalityPrefs).length;
  const lineNotes = useSyncExternalStore(subscribeSongLineNotes, getSongLineNotesSnapshot);
  const lineNotesSongCount = Object.keys(lineNotes).length;
  useSyncExternalStore(subscribeLocalAlbums, getLocalAlbumsSnapshot); // keep albums count live
  useSyncExternalStore(subscribeSongDisplayConfig, getSongDisplayConfigSnapshot); // keep appearance defaults live

  const [backupStep, setBackupStep] = useState<BackupStep>({ kind: 'idle' });

  const toggleCategory = (key: BackupCategory) => {
    setBackupStep(prev => {
      if (prev.kind === 'idle') return prev;
      if (prev.kind === 'import' && !prev.present[key]) return prev; // not in the file — not toggleable
      return { ...prev, selection: { ...prev.selection, [key]: !prev.selection[key] } };
    });
  };

  const startExport = () => setBackupStep({ kind: 'export', selection: selectionOf(true) });
  const cancelBackupStep = () => setBackupStep({ kind: 'idle' });

  const confirmExport = () => {
    if (backupStep.kind !== 'export') return;
    const { selection } = backupStep;
    const data: ExportedSettings = {
      version: 2,
      exportedAt: new Date().toISOString(),
      ...(selection.favorites && { favorites: getLocalFavorites() }),
      ...(selection.pins && { pinOverrides: getPinOverrides() }),
      ...(selection.tags && { customGroups: getAllLocalGroups() }),
      ...(selection.tonality && { tonalityPrefs: getAllSongTonalityPrefs() }),
      ...(selection.lineNotes && { lineNotes: getSongLineNotesSnapshot() }),
      ...(selection.albums && {
        albums: getAllAlbums().map(album => ({ name: album.name, songs: album.songs })),
      }),
      ...(selection.appearance && { appearanceDefaults: getAllGlobalDefaults() }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `band-rehearsal-helper-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupStep({ kind: 'idle' });
  };

  const handleFileSelected = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ExportedSettings>;
      const present = presentCategoriesOf(parsed);
      if (!Object.values(present).some(Boolean)) {
        throw new Error('no recognized data in this file');
      }
      // Pre-check only what the file actually has — the rest stay
      // unchecked AND disabled, so there's nothing to accidentally toggle on.
      setBackupStep({ kind: 'import', parsed, present, selection: { ...present } });
    } catch (err) {
      setMessage(`Import failed: ${(err as Error).message}`);
    }
  };

  const confirmImport = () => {
    if (backupStep.kind !== 'import') return;
    const { parsed, selection } = backupStep;
    const imported: string[] = [];

    if (selection.favorites && Array.isArray(parsed.favorites)) {
      const merged = new Set([...getLocalFavorites(), ...parsed.favorites]);
      setLocalFavorites(Array.from(merged));
      imported.push(`${parsed.favorites.length} favorite(s)`);
    }

    if (selection.pins && parsed.pinOverrides) {
      setPinOverrides({ ...getPinOverrides(), ...parsed.pinOverrides });
      imported.push(`${Object.keys(parsed.pinOverrides).length} pin override(s)`);
    }

    if (selection.tags && parsed.customGroups) {
      const merged: LocalGroups = { ...getAllLocalGroups() };
      for (const [songName, labels] of Object.entries(parsed.customGroups)) {
        const existing = merged[songName] ?? [];
        const toAdd = labels.filter(
          label => !existing.some(e => e.toLowerCase() === label.toLowerCase())
        );
        merged[songName] = [...existing, ...toAdd];
      }
      setAllLocalGroups(merged);
      imported.push(`${Object.keys(parsed.customGroups).length} song(s) with custom groups`);
    }

    if (selection.tonality && parsed.tonalityPrefs) {
      mergeSongTonalityPrefs(parsed.tonalityPrefs);
      imported.push(`${Object.keys(parsed.tonalityPrefs).length} tonality/capo choice(s)`);
    }

    if (selection.lineNotes && parsed.lineNotes) {
      mergeSongLineNotes(parsed.lineNotes);
      imported.push(`${Object.keys(parsed.lineNotes).length} song(s) with line notes`);
    }

    if (selection.albums && parsed.albums) {
      const added = mergeImportedAlbums(parsed.albums);
      imported.push(`${added} new album(s) (existing names skipped)`);
    }

    if (selection.appearance && parsed.appearanceDefaults) {
      mergeGlobalDefaults(parsed.appearanceDefaults);
      imported.push('appearance defaults');
    }

    setMessage(imported.length > 0 ? `Imported: ${imported.join(', ')}.` : 'Nothing was checked.');
    setBackupStep({ kind: 'idle' });
  };

  const handleResetFavorites = () => {
    if (window.confirm('Reset all local favorites? This cannot be undone.')) {
      resetLocalFavorites();
      setMessage('Local favorites reset.');
    }
  };

  const handleResetPins = () => {
    if (window.confirm('Reset pinned songs back to what the sheet says? This cannot be undone.')) {
      resetPinOverrides();
      setMessage('Pin overrides reset — back to the sheet’s PinedByDefault.');
    }
  };

  const handleResetGroups = () => {
    if (window.confirm('Remove all your custom groups? This cannot be undone.')) {
      resetLocalGroups();
      setMessage('Custom groups reset.');
    }
  };

  const handleResetTonalityPrefs = () => {
    if (window.confirm('Reset your saved tonality/capo choices for every song?')) {
      resetSongTonalityPrefs();
      setMessage('Tonality/capo choices reset.');
    }
  };

  const handleResetLineNotes = () => {
    if (
      window.confirm('Delete all your line/label notes, for every song? This cannot be undone.')
    ) {
      resetSongLineNotes();
      setMessage('Line notes cleared.');
    }
  };

  const sectionTitleClass =
    'text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 pb-1 border-b border-gray-200 dark:border-gray-700';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogTitle>Settings</DialogTitle>

        <div className="space-y-5">
          <div className="space-y-3">
            <h2 className={sectionTitleClass}>Appearance</h2>
            <SettingsAppearanceSection />
          </div>

          <div className="space-y-4">
            <h2 className={sectionTitleClass}>Backup &amp; Caches</h2>

            <div>
              <h3 className="text-sm font-semibold mb-1">My favorites ({favorites.size})</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {favorites.size > 0
                  ? "Songs you've starred locally — this is what prev/next navigates within."
                  : "You haven't starred anything yet, so prev/next currently falls back to the sheet's pinned songs. Starring any song switches navigation over to your own list."}
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetFavorites}
                disabled={favorites.size === 0}
              >
                Reset Favorites
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Pinned overrides ({pinOverrideCount})</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Songs where you've locally overridden the sheet's own PinedByDefault column.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetPins}
                disabled={pinOverrideCount === 0}
              >
                Reset Pinned by Default
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                My groups ({customGroupedSongsCount} songs tagged)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Your own local groups (bookmark icon), on top of the sheet's GroupBy column.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetGroups}
                disabled={customGroupedSongsCount === 0}
              >
                Reset My Groups
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                Tonality/capo choices ({tonalityPrefCount} songs)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                The key (and matching capo) you last picked per song, remembered locally so the song
                reopens the way you left it.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetTonalityPrefs}
                disabled={tonalityPrefCount === 0}
              >
                Reset Tonality/Capo Choices
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                Line/label notes ({lineNotesSongCount} songs)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Personal cues on lyric/chord lines or section labels, kept purely local.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetLineNotes}
                disabled={lineNotesSongCount === 0}
              >
                Clear Line Notes
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">Backup</h3>

              {backupStep.kind === 'idle' && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Export picks which categories to include; import reads the file first and only
                    lets you bring in what it actually contains.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={startExport}>
                      <Upload className="w-4 h-4" />
                      Export
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Download className="w-4 h-4" />
                      Import
                    </Button>
                  </div>
                </>
              )}

              {(backupStep.kind === 'export' || backupStep.kind === 'import') && (
                <div className="rounded border border-gray-200 dark:border-gray-700 p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {backupStep.kind === 'export'
                      ? 'Choose what to include in the exported file:'
                      : "Choose what to bring in — greyed-out categories aren't in this file:"}
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3">
                    {BACKUP_CATEGORIES.map(category => {
                      const disabled =
                        backupStep.kind === 'import' && !backupStep.present[category.key];
                      return (
                        <label
                          key={category.key}
                          className={`flex items-center gap-1.5 text-xs ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={backupStep.selection[category.key]}
                            disabled={disabled}
                            onChange={() => toggleCategory(category.key)}
                            className="h-3.5 w-3.5 accent-blue-600"
                          />
                          {category.label}
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={backupStep.kind === 'export' ? confirmExport : confirmImport}
                    >
                      {backupStep.kind === 'export' ? 'Export' : 'Apply'}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelBackupStep}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

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
            </div>
          </div>

          {message && <p className="text-xs text-gray-600 dark:text-gray-300">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
