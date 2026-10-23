import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Pencil, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SettingsAppearanceSection } from '@/components/modals/SettingsAppearanceSection';
import { SettingsLanguageSection } from '@/components/modals/SettingsLanguageSection';
import { CachedSongListModal } from '@/components/modals/CachedSongListModal';
import { TonalityPresetDialog } from '@/components/modals/TonalityPresetDialog';
import { LineNotesPresetDialog } from '@/components/modals/LineNotesPresetDialog';
import { GroupEditorDialog } from '@/components/shared/GroupEditorDialog';
import { AudioOutputButton } from '@/components/shared/AudioOutputButton';
import { AudioOutputStatus } from '@/components/shared/AudioOutputStatus';
import { showToast } from '@/lib/toast';
import { MetronomeModal } from '@/components/metronome/MetronomeModal';
import {
  getLocalFavorites,
  resetLocalFavorites,
  setLocalFavorites,
  subscribeLocalFavorites,
  getLocalFavoritesSnapshot,
} from '@/lib/localFavorites';
import {
  deletePinOverride,
  getPinOverrides,
  resetPinOverrides,
  setPinOverrides,
  subscribePinOverrides,
  getPinOverridesSnapshot,
} from '@/lib/localPins';
import {
  deleteSongGroups,
  getAllLocalGroups,
  resetLocalGroups,
  setAllLocalGroups,
  subscribeLocalGroups,
  getLocalGroupsSnapshot,
  type LocalGroups,
} from '@/lib/localGroups';
import {
  applySongTonalityToParams,
  deleteSongTonalityPref,
  getAllSongTonalityPrefs,
  mergeSongTonalityPrefs,
  resetSongTonalityPrefs,
  subscribeSongTonalityPrefs,
  getSongTonalityPrefsSnapshot,
} from '@/lib/songKeyPrefs';
import {
  deleteSongLineNotes,
  mergeSongLineNotes,
  resetSongLineNotes,
  subscribeSongLineNotes,
  getSongLineNotesSnapshot,
} from '@/lib/songLineNotes';
import {
  deleteMetronomePreset,
  mergeMetronomePresets,
  resetMetronomePresets,
  subscribeMetronomePresets,
  getMetronomePresetsSnapshot,
} from '@/lib/metronomePresets';
import {
  getAllSetlists,
  mergeImportedSetlists,
  subscribeLocalSetlists,
  getLocalSetlistsSnapshot,
} from '@/lib/localSetlists';
import {
  getAllGlobalDefaults,
  mergeGlobalDefaults,
  subscribeSongDisplayConfig,
  getSongDisplayConfigSnapshot,
} from '@/lib/songDisplayConfig';
import type { ExportedSettings } from '@/lib/settingsBackupFormat';
import type { Song } from '@/types/song';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSongs: Song[];
}

type BackupCategory =
  | 'favorites'
  | 'pins'
  | 'tags'
  | 'tonality'
  | 'lineNotes'
  | 'setlists'
  | 'appearance'
  | 'metronomePresets';

const BACKUP_CATEGORY_KEYS: BackupCategory[] = [
  'favorites',
  'pins',
  'tags',
  'tonality',
  'lineNotes',
  'setlists',
  'appearance',
  'metronomePresets',
];

function selectionOf(value: boolean): Record<BackupCategory, boolean> {
  return Object.fromEntries(BACKUP_CATEGORY_KEYS.map(key => [key, value])) as Record<
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
    setlists: Array.isArray(parsed.setlists),
    appearance: Boolean(parsed.appearanceDefaults),
    metronomePresets: Boolean(
      parsed.metronomePresets && typeof parsed.metronomePresets === 'object'
    ),
  };
}

/** The per-song categories that get an edit list (name + edit + remove) — Favorites/Setlists/Appearance aren't per-song caches in the same shape. */
type SongListCategory = 'pins' | 'tags' | 'tonality' | 'lineNotes' | 'metronomePresets';

/** Next to a reset button — opens the list of exactly which songs it covers, for editing/removing individually. */
function EditListButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="default"
      size="icon"
      onClick={onClick}
      title={t('Edit which songs')}
    >
      <Pencil className="size-5" />
    </Button>
  );
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

const BACKUP_CATEGORY_LABEL_KEY: Record<BackupCategory, string> = {
  favorites: 'Favorites',
  pins: 'Pinned overrides',
  tags: 'Tags (groups)',
  tonality: 'Tonality/Capo choices',
  lineNotes: 'Line/label notes',
  setlists: 'Setlists',
  appearance: 'Appearance settings',
  metronomePresets: 'Metronome presets',
};

const SONG_LIST_TITLE_KEY: Record<SongListCategory, string> = {
  pins: 'Pinned overrides',
  tags: 'My groups',
  tonality: 'Tonality/Capo choices',
  lineNotes: 'Line/label notes',
  metronomePresets: 'Metronome presets',
};

export function SettingsModal({ open, onOpenChange, allSongs }: SettingsModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const songByName = useMemo(() => new Map(allSongs.map(song => [song.Name, song])), [allSongs]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listCategory, setListCategory] = useState<SongListCategory | null>(null);
  const [editing, setEditing] = useState<{ category: SongListCategory; songName: string } | null>(
    null
  );
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
  const metronomePresets = useSyncExternalStore(
    subscribeMetronomePresets,
    getMetronomePresetsSnapshot
  );
  const metronomePresetsCount = Object.keys(metronomePresets).length;
  useSyncExternalStore(subscribeLocalSetlists, getLocalSetlistsSnapshot); // keep setlists count live
  useSyncExternalStore(subscribeSongDisplayConfig, getSongDisplayConfigSnapshot); // keep appearance defaults live

  const [backupStep, setBackupStep] = useState<BackupStep>({ kind: 'idle' });

  const toggleCategory = (key: BackupCategory) => {
    setBackupStep(prev => {
      if (prev.kind === 'idle') return prev;
      if (prev.kind === 'import' && !prev.present[key]) return prev; // not in the file — not toggleable
      return { ...prev, selection: { ...prev.selection, [key]: !prev.selection[key] } };
    });
  };

  const startExport = () =>
    setBackupStep({ kind: 'export', selection: { ...selectionOf(true), appearance: false } });
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
      ...(selection.setlists && {
        setlists: getAllSetlists().map(setlist => ({ name: setlist.name, songs: setlist.songs })),
      }),
      ...(selection.appearance && { appearanceDefaults: getAllGlobalDefaults() }),
      ...(selection.metronomePresets && { metronomePresets: getMetronomePresetsSnapshot() }),
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
        throw new Error(t('no recognized data in this file'));
      }
      // Pre-check only what the file actually has — the rest stay
      // unchecked AND disabled, so there's nothing to accidentally toggle on.
      setBackupStep({ kind: 'import', parsed, present, selection: { ...present } });
    } catch (err) {
      showToast(t('Import failed: {{message}}', { message: (err as Error).message }), 'error');
    }
  };

  const confirmImport = () => {
    if (backupStep.kind !== 'import') return;
    const { parsed, selection } = backupStep;
    const imported: string[] = [];

    if (selection.favorites && Array.isArray(parsed.favorites)) {
      const merged = new Set([...getLocalFavorites(), ...parsed.favorites]);
      setLocalFavorites(Array.from(merged));
      imported.push(t('{{count}} favorite(s)', { count: parsed.favorites.length }));
    }

    if (selection.pins && parsed.pinOverrides) {
      setPinOverrides({ ...getPinOverrides(), ...parsed.pinOverrides });
      imported.push(
        t('{{count}} pin override(s)', { count: Object.keys(parsed.pinOverrides).length })
      );
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
      imported.push(
        t('{{count}} song(s) with custom groups', {
          count: Object.keys(parsed.customGroups).length,
        })
      );
    }

    if (selection.tonality && parsed.tonalityPrefs) {
      mergeSongTonalityPrefs(parsed.tonalityPrefs);
      imported.push(
        t('{{count}} tonality/capo choice(s)', { count: Object.keys(parsed.tonalityPrefs).length })
      );
    }

    if (selection.lineNotes && parsed.lineNotes) {
      mergeSongLineNotes(parsed.lineNotes);
      imported.push(
        t('{{count}} song(s) with line notes', { count: Object.keys(parsed.lineNotes).length })
      );
    }

    if (selection.setlists && parsed.setlists) {
      const added = mergeImportedSetlists(parsed.setlists);
      imported.push(t('{{count}} new setlist(s) (existing names skipped)', { count: added }));
    }

    if (selection.appearance && parsed.appearanceDefaults) {
      mergeGlobalDefaults(parsed.appearanceDefaults);
      imported.push(t('appearance defaults'));
    }

    if (selection.metronomePresets && parsed.metronomePresets) {
      mergeMetronomePresets(parsed.metronomePresets);
      imported.push(
        t('{{count}} metronome preset(s)', { count: Object.keys(parsed.metronomePresets).length })
      );
    }

    showToast(
      imported.length > 0
        ? t('Imported: {{list}}.', { list: imported.join(', ') })
        : t('Nothing was checked.'),
      imported.length > 0 ? 'success' : 'info'
    );
    setBackupStep({ kind: 'idle' });
  };

  const handleResetFavorites = () => {
    if (window.confirm(t('Reset all local favorites? This cannot be undone.'))) {
      resetLocalFavorites();
      showToast(t('Local favorites reset.'), 'success');
    }
  };

  const handleResetPins = () => {
    if (
      window.confirm(t('Reset pinned songs back to what the sheet says? This cannot be undone.'))
    ) {
      resetPinOverrides();
      showToast(t("Pin overrides reset — back to the sheet's own PinedByDefault."), 'success');
    }
  };

  const handleResetGroups = () => {
    if (window.confirm(t('Remove all your custom groups? This cannot be undone.'))) {
      resetLocalGroups();
      showToast(t('Custom groups reset.'), 'success');
    }
  };

  const handleResetTonalityPrefs = () => {
    if (window.confirm(t('Reset your saved tonality/capo choices for every song?'))) {
      resetSongTonalityPrefs();
      showToast(t('Tonality/capo choices reset.'), 'success');
    }
  };

  const handleResetLineNotes = () => {
    if (
      window.confirm(t('Delete all your line/label notes, for every song? This cannot be undone.'))
    ) {
      resetSongLineNotes();
      showToast(t('Line notes cleared.'), 'success');
    }
  };

  const handleResetMetronomePresets = () => {
    if (
      window.confirm(
        t('Delete all saved metronome presets, for every song? This cannot be undone.')
      )
    ) {
      resetMetronomePresets();
      showToast(t('Metronome presets cleared.'), 'success');
    }
  };

  const songNamesForList = (category: SongListCategory): string[] => {
    switch (category) {
      case 'pins':
        return Object.keys(pinOverrides);
      case 'tags':
        return Object.keys(customGroups);
      case 'tonality':
        return Object.keys(tonalityPrefs);
      case 'lineNotes':
        return Object.keys(lineNotes);
      case 'metronomePresets':
        return Object.keys(metronomePresets);
    }
  };

  const removeConfirmTextFor = (category: SongListCategory) => (songName: string) => {
    switch (category) {
      case 'pins':
        return t(
          'Remove the pin override for "{{songName}}"? It\'ll go back to the sheet\'s own PinedByDefault.',
          { songName }
        );
      case 'tags':
        return t('Remove all groups/tags from "{{songName}}"?', { songName });
      case 'tonality':
        return t(
          'Reset the tonality/capo choice for "{{songName}}"? It\'ll go back to the song\'s original key.',
          { songName }
        );
      case 'lineNotes':
        return t('Delete all line notes for "{{songName}}"? This cannot be undone.', { songName });
      case 'metronomePresets':
        return t('Delete the saved metronome preset for "{{songName}}"?', { songName });
    }
  };

  const handleRemoveFromList = (category: SongListCategory, songName: string) => {
    switch (category) {
      case 'pins':
        deletePinOverride(songName);
        break;
      case 'tags':
        deleteSongGroups(songName);
        break;
      case 'tonality':
        deleteSongTonalityPref(songName);
        break;
      case 'lineNotes':
        deleteSongLineNotes(songName);
        break;
      case 'metronomePresets':
        deleteMetronomePreset(songName);
        break;
    }
  };

  // Pinned overrides has no edit action — its list has no pencil at all,
  // since the "same control as the song page" would just be a single
  // instant toggle, not a real editor.
  const handleEditFromList = (category: Exclude<SongListCategory, 'pins'>, songName: string) => {
    setEditing({ category, songName });
  };

  const handleSongClick = (songName: string) => {
    setListCategory(null);
    setEditing(null);
    onOpenChange(false);
    // Keep the current query string (tableId above all) and only touch
    // ?tonality=, same as every other in-app "go to this song" navigation.
    const next = applySongTonalityToParams(searchParams, songName);
    navigate(`/song/${encodeURIComponent(songName)}?${next.toString()}`, {
      state: { fromAppNav: true },
    });
  };

  const sectionTitleClass =
    'text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100 pb-1 border-b border-gray-200 dark:border-gray-700';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <DialogTitle>{t('Settings')}</DialogTitle>

        <div className="space-y-5 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-3">
            <h2 className={sectionTitleClass}>{t('Language')}</h2>
            <SettingsLanguageSection />
          </div>

          <div className="space-y-3">
            <h2 className={sectionTitleClass}>{t('Appearance')}</h2>
            <SettingsAppearanceSection />
          </div>

          <div className="space-y-3">
            <h2 className={sectionTitleClass}>{t('Audio Output')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t(
                'Send audio (currently just the metronome) to a specific output device instead of your system default.'
              )}
            </p>
            <div className="flex items-center justify-between gap-2">
              <AudioOutputStatus />
              <AudioOutputButton />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className={sectionTitleClass}>{t('Backup & Caches')}</h2>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                {t('My favorites ({{count}})', { count: favorites.size })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {favorites.size > 0
                  ? t("Songs you've starred locally — this is what prev/next navigates within.")
                  : t(
                      "You haven't starred anything yet, so prev/next currently falls back to the sheet's pinned songs. Starring any song switches navigation over to your own list."
                    )}
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetFavorites}
                disabled={favorites.size === 0}
              >
                {t('Reset Favorites')}
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                {t('Pinned overrides ({{count}})', { count: pinOverrideCount })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t("Songs where you've locally overridden the sheet's own PinedByDefault column.")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetPins}
                  disabled={pinOverrideCount === 0}
                >
                  {t('Reset Pinned by Default')}
                </Button>
                <EditListButton onClick={() => setListCategory('pins')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                {t('My groups ({{count}} songs tagged)', { count: customGroupedSongsCount })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t("Your own local groups (bookmark icon), on top of the sheet's GroupBy column.")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetGroups}
                  disabled={customGroupedSongsCount === 0}
                >
                  {t('Reset My Groups')}
                </Button>
                <EditListButton onClick={() => setListCategory('tags')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                {t('Tonality/capo choices ({{count}} songs)', { count: tonalityPrefCount })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t(
                  'The key (and matching capo) you last picked per song, remembered locally so the song reopens the way you left it.'
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetTonalityPrefs}
                  disabled={tonalityPrefCount === 0}
                >
                  {t('Reset Tonality/Capo Choices')}
                </Button>
                <EditListButton onClick={() => setListCategory('tonality')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                {t('Line/label notes ({{count}} songs)', { count: lineNotesSongCount })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t('Personal cues on lyric/chord lines or section labels, kept purely local.')}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetLineNotes}
                  disabled={lineNotesSongCount === 0}
                >
                  {t('Clear Line Notes')}
                </Button>
                <EditListButton onClick={() => setListCategory('lineNotes')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1">
                {t('Metronome presets ({{count}} songs)', { count: metronomePresetsCount })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t(
                  'Tempo, time signature, and accent pattern, remembered per song so its metronome reopens the way you left it.'
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetMetronomePresets}
                  disabled={metronomePresetsCount === 0}
                >
                  {t('Reset Metronome Presets')}
                </Button>
                <EditListButton onClick={() => setListCategory('metronomePresets')} />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold mb-1">{t('Backup')}</h3>

              {backupStep.kind === 'idle' && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t(
                      'Export picks which categories to include; import reads the file first and only lets you bring in what it actually contains.'
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={startExport}>
                      <Upload />
                      {t('Export')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Download />
                      {t('Import')}
                    </Button>
                  </div>
                </>
              )}

              {(backupStep.kind === 'export' || backupStep.kind === 'import') && (
                <div className="rounded border border-gray-200 dark:border-gray-700 p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {backupStep.kind === 'export'
                      ? t('Choose what to include in the exported file:')
                      : t("Choose what to bring in — greyed-out categories aren't in this file:")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3">
                    {BACKUP_CATEGORY_KEYS.map(key => {
                      const disabled = backupStep.kind === 'import' && !backupStep.present[key];
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-1.5 text-xs ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={backupStep.selection[key]}
                            disabled={disabled}
                            onChange={() => toggleCategory(key)}
                            className="h-3.5 w-3.5 accent-blue-600"
                          />
                          {t(BACKUP_CATEGORY_LABEL_KEY[key])}
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={backupStep.kind === 'export' ? confirmExport : confirmImport}
                    >
                      {backupStep.kind === 'export' ? t('Export') : t('Apply')}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelBackupStep}>
                      {t('Cancel')}
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
        </div>
      </DialogContent>

      {listCategory && (
        <CachedSongListModal
          open
          onClose={() => setListCategory(null)}
          title={t(SONG_LIST_TITLE_KEY[listCategory])}
          songNames={songNamesForList(listCategory)}
          onSongClick={handleSongClick}
          onEdit={
            listCategory === 'pins'
              ? undefined
              : songName => handleEditFromList(listCategory, songName)
          }
          onRemove={songName => handleRemoveFromList(listCategory, songName)}
          removeConfirmText={removeConfirmTextFor(listCategory)}
        />
      )}

      {editing?.category === 'tags' && (
        <GroupEditorDialog
          open
          onOpenChange={next => !next && setEditing(null)}
          songName={editing.songName}
        />
      )}

      {editing?.category === 'tonality' &&
        (() => {
          const song = songByName.get(editing.songName);
          return song ? (
            <TonalityPresetDialog open onClose={() => setEditing(null)} song={song} />
          ) : null;
        })()}

      {editing?.category === 'lineNotes' && (
        <LineNotesPresetDialog open onClose={() => setEditing(null)} songName={editing.songName} />
      )}

      {editing?.category === 'metronomePresets' && (
        <MetronomeModal
          open
          onClose={() => setEditing(null)}
          hasOpenedOnce
          resetKey={editing.songName}
          bpm={songByName.get(editing.songName)?.BPM ?? null}
          timeSignature={songByName.get(editing.songName)?.TimeSignature ?? null}
          songName={editing.songName}
        />
      )}
    </Dialog>
  );
}
