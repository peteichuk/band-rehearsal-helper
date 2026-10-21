import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, LayoutGrid, List, ListMusic, Plus, Share2, Trash2, Upload } from 'lucide-react';
import { ToggleButtonPair } from '@/components/shared/ToggleButtonPair';
import { SwipeToDeleteRow } from '@/components/shared/SwipeToDeleteRow';
import { SetlistFormDialog } from '@/components/setlists/SetlistFormDialog';
import {
  SetlistImportConflictDialog,
  type ImportConflictChoice,
} from '@/components/setlists/SetlistImportConflictDialog';
import {
  SetlistExportOptionsDialog,
  type SetlistExportExtrasSelection,
} from '@/components/setlists/SetlistExportOptionsDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useLocalSetlists } from '@/hooks/useLocalSetlists';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import {
  downloadSetlistAsFile,
  downloadSetlistsAsFile,
  parseSetlistsFile,
  type SetlistBundleExtras,
} from '@/lib/setlistFileTransfer';
import { showToast } from '@/lib/toast';
import { getSongLineNotesSnapshot, mergeSongLineNotes } from '@/lib/songLineNotes';
import { getSongTonalityPrefsSnapshot, mergeSongTonalityPrefs } from '@/lib/songKeyPrefs';
import { getMetronomePresetsSnapshot, mergeMetronomePresets } from '@/lib/metronomePresets';
import type { Setlist } from '@/lib/localSetlists';
import type { Song } from '@/types/song';

/** Narrows a song-keyed store down to just the given song names. */
function pickBySongNames<T>(store: Record<string, T>, songNames: Set<string>): Record<string, T> {
  return Object.fromEntries(Object.entries(store).filter(([name]) => songNames.has(name)));
}

interface SetlistsViewProps {
  allSongs: Song[];
}

export function SetlistsView({ allSongs }: SetlistsViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    allSetlists,
    createSetlist,
    deleteSetlist,
    findSetlistByName,
    importSetlist,
    addSongToSetlist,
  } = useLocalSetlists();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConflict, setImportConflict] = useState<{
    name: string;
    resolve: (result: { choice: ImportConflictChoice; applyToAll: boolean }) => void;
  } | null>(null);

  // tableId (and anything else already in the URL) has to ride along, or
  // the setlist page loses it and the catalog it needs to resolve songs from.
  const openSetlist = (setlistId: string) =>
    navigate(`/setlists/${encodeURIComponent(setlistId)}?${searchParams.toString()}`);
  const [displayMode, setDisplayMode] = useLocalStorageState<'tiles' | 'list'>(
    'setlistsDisplayMode',
    'list'
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [showExportOptions, setShowExportOptions] = useState(false);
  // Export selection only ever shows the list layout — never persisted via
  // setDisplayMode (that writes to localStorage), so a mid-selection reload
  // wouldn't even see this override, and leaving the real displayMode state
  // untouched means it reverts to wherever the user actually was (tiles or
  // list) the moment export mode ends, with no bookkeeping needed.
  const effectiveDisplayMode = isExportMode ? 'list' : displayMode;

  const songCount = (setlistId: string) => {
    const setlist = allSetlists.find(candidate => candidate.id === setlistId);
    if (!setlist) return 0;
    const presentNames = new Set(allSongs.map(song => song.Name));
    return setlist.songs.filter(entry => presentNames.has(entry.songName)).length;
  };

  const confirmDeleteSetlist = (setlist: Setlist) => {
    if (window.confirm(`Delete "${setlist.name}"? This only removes it from this device.`)) {
      deleteSetlist(setlist.id);
      showToast(`Setlist "${setlist.name}" deleted.`, 'success');
    }
  };

  // The swipe-to-reveal gesture itself is the confirmation here — tapping
  // the revealed red button is already a deliberate second step, so an
  // extra window.confirm on top of it would be redundant. A toast is enough
  // of a notice after the fact.
  const handleSwipeDelete = (setlist: Setlist) => {
    deleteSetlist(setlist.id);
    showToast(`Setlist "${setlist.name}" deleted.`, 'success');
  };

  const startExportMode = () => {
    setSelectedForExport(new Set());
    setIsExportMode(true);
  };

  const cancelExportMode = () => {
    setIsExportMode(false);
    setSelectedForExport(new Set());
  };

  const toggleSelectedForExport = (setlistId: string) => {
    setSelectedForExport(prev => {
      const next = new Set(prev);
      if (next.has(setlistId)) next.delete(setlistId);
      else next.add(setlistId);
      return next;
    });
  };

  const allSelectedForExport =
    allSetlists.length > 0 && allSetlists.every(setlist => selectedForExport.has(setlist.id));

  const toggleSelectAllForExport = () => {
    setSelectedForExport(
      allSelectedForExport ? new Set() : new Set(allSetlists.map(setlist => setlist.id))
    );
  };

  const confirmExport = (extrasSelection: SetlistExportExtrasSelection) => {
    const selected = allSetlists.filter(setlist => selectedForExport.has(setlist.id));
    const songNames = new Set(
      selected.flatMap(setlist => setlist.songs.map(entry => entry.songName))
    );

    const extras: SetlistBundleExtras = {
      ...(extrasSelection.lineNotes && {
        lineNotes: pickBySongNames(getSongLineNotesSnapshot(), songNames),
      }),
      ...(extrasSelection.tonality && {
        tonalityPrefs: pickBySongNames(getSongTonalityPrefsSnapshot(), songNames),
      }),
      ...(extrasSelection.metronomePresets && {
        metronomePresets: pickBySongNames(getMetronomePresetsSnapshot(), songNames),
      }),
    };

    downloadSetlistsAsFile(selected, extras);
    showToast(`Exported ${selected.length} setlist${selected.length === 1 ? '' : 's'}.`, 'success');
    setShowExportOptions(false);
    cancelExportMode();
  };

  const resolveImportConflict = (
    name: string
  ): Promise<{ choice: ImportConflictChoice; applyToAll: boolean }> =>
    new Promise(resolve => setImportConflict({ name, resolve }));

  const handleImportFile = async (file: File) => {
    try {
      const {
        setlists: entries,
        lineNotes,
        tonalityPrefs,
        metronomePresets,
      } = await parseSetlistsFile(file);
      let importedCount = 0;
      let cancelled = false;
      // Songs belonging to a setlist that actually got imported this run —
      // the only ones the optional per-song extras below get applied to,
      // so a Cancel partway through leaves the rest untouched too.
      const importedSongNames = new Set<string>();
      // Once the user picks "Apply for all" on Merge/Replace, every later
      // collision in this same import reuses that choice instead of asking
      // again. Cancel is never "forced" this way — it always aborts the
      // whole import right away instead of being remembered per-item.
      let forcedChoice: 'merge' | 'replace' | null = null;
      for (const { name, songs } of entries) {
        const existing = findSetlistByName(name);
        if (existing) {
          let choice: ImportConflictChoice | null = forcedChoice;
          if (!choice) {
            const result = await resolveImportConflict(name);
            if (result.choice === 'cancel') {
              cancelled = true;
              break;
            }
            choice = result.choice;
            if (result.applyToAll) forcedChoice = result.choice;
          }
          if (choice === 'replace') {
            importSetlist(name, songs, existing.id);
          } else {
            // Merge — append each imported song onto the existing setlist;
            // addSongToSetlist already dedupes and lands new ones at the end.
            for (const song of songs) addSongToSetlist(existing.id, song.songName);
          }
        } else {
          importSetlist(name, songs);
        }
        for (const song of songs) importedSongNames.add(song.songName);
        importedCount += 1;
      }

      // Optional per-song extras — merged the same way regardless of each
      // setlist's own merge/replace choice: the imported value wins for any
      // song/line it covers, everything else already on the device is left
      // alone (mergeSongLineNotes/mergeSongTonalityPrefs/mergeMetronomePresets
      // all already work this way).
      if (lineNotes) mergeSongLineNotes(pickBySongNames(lineNotes, importedSongNames));
      if (tonalityPrefs) mergeSongTonalityPrefs(pickBySongNames(tonalityPrefs, importedSongNames));
      if (metronomePresets) {
        mergeMetronomePresets(pickBySongNames(metronomePresets, importedSongNames));
      }

      if (importedCount > 0) {
        showToast(`Imported ${importedCount} setlist${importedCount === 1 ? '' : 's'}.`, 'success');
      } else if (cancelled) {
        showToast('Import cancelled.', 'info');
      }
    } catch (err) {
      showToast(`Import failed: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        {isExportMode ? (
          <>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={allSelectedForExport}
                  onChange={toggleSelectAllForExport}
                  className="h-4 w-4 accent-blue-600"
                />
                Select all
              </label>
              <button
                type="button"
                onClick={cancelExportMode}
                className="h-9 px-3 flex items-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowExportOptions(true)}
              disabled={selectedForExport.size === 0}
              className="h-9 px-3 flex items-center gap-1.5 rounded bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
            >
              <Upload className="w-4 h-4" />
              Export
            </button>
          </>
        ) : (
          <>
            <ToggleButtonPair
              value={displayMode}
              onChange={setDisplayMode}
              activeClassName="bg-blue-700 dark:bg-blue-600 text-white"
              inactiveClassName="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              options={[
                { value: 'tiles', label: 'Tiles', icon: <LayoutGrid className="w-4 h-4" /> },
                { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
              ]}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Import setlist"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-10 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Export setlists"
                onClick={startExportMode}
                disabled={allSetlists.length === 0}
                className="h-9 w-10 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="h-9 px-3 flex items-center gap-1.5 rounded bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New setlist
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void handleImportFile(file);
                  event.target.value = '';
                }}
              />
            </div>
          </>
        )}
      </div>

      {allSetlists.length === 0 && (
        <EmptyState
          title="No setlists yet"
          message='Create one with "New setlist", or add a song to a setlist from its ⋮ menu.'
        />
      )}

      {allSetlists.length > 0 && effectiveDisplayMode === 'tiles' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allSetlists.map(setlist => (
            <div
              key={setlist.id}
              role="button"
              tabIndex={0}
              onClick={() => openSetlist(setlist.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openSetlist(setlist.id);
                }
              }}
              className="relative cursor-pointer rounded bg-blue-100 dark:bg-gray-800 hover:bg-blue-200 dark:hover:bg-gray-700 p-3 flex flex-col items-center gap-1 text-center"
            >
              <div className="absolute top-1 right-1 flex items-center gap-0.5">
                <button
                  type="button"
                  title="Share setlist"
                  onClick={event => {
                    event.stopPropagation();
                    downloadSetlistAsFile(setlist);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete setlist"
                  onClick={event => {
                    event.stopPropagation();
                    confirmDeleteSetlist(setlist);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <ListMusic className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium break-words">{setlist.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {songCount(setlist.id)} song{songCount(setlist.id) === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}

      {allSetlists.length > 0 && effectiveDisplayMode === 'list' && (
        <div className="space-y-1">
          {allSetlists.map(setlist => {
            const row = (
              <div
                role={isExportMode ? 'checkbox' : 'button'}
                aria-checked={isExportMode ? selectedForExport.has(setlist.id) : undefined}
                tabIndex={0}
                onClick={() =>
                  isExportMode ? toggleSelectedForExport(setlist.id) : openSetlist(setlist.id)
                }
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (isExportMode) toggleSelectedForExport(setlist.id);
                    else openSetlist(setlist.id);
                  }
                }}
                className="w-full px-2 py-2 flex items-center gap-2 rounded bg-blue-100 dark:bg-gray-800 hover:bg-blue-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                {isExportMode && (
                  <input
                    type="checkbox"
                    checked={selectedForExport.has(setlist.id)}
                    onChange={() => toggleSelectedForExport(setlist.id)}
                    onClick={event => event.stopPropagation()}
                    className="h-4 w-4 shrink-0 accent-blue-600"
                  />
                )}
                <ListMusic className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="flex-1 min-w-0 truncate font-medium">{setlist.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {songCount(setlist.id)} song{songCount(setlist.id) === 1 ? '' : 's'}
                </span>
                {!isExportMode && (
                  <button
                    type="button"
                    title="Share setlist"
                    onClick={event => {
                      event.stopPropagation();
                      downloadSetlistAsFile(setlist);
                    }}
                    className="shrink-0 h-9 w-10 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );

            return isExportMode ? (
              <div key={setlist.id}>{row}</div>
            ) : (
              <SwipeToDeleteRow key={setlist.id} onDelete={() => handleSwipeDelete(setlist)}>
                {row}
              </SwipeToDeleteRow>
            );
          })}
        </div>
      )}

      <SetlistFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={name => createSetlist(name)}
      />
      <SetlistImportConflictDialog
        setlistName={importConflict?.name ?? null}
        onChoice={(choice, applyToAll) => {
          importConflict?.resolve({ choice, applyToAll });
          setImportConflict(null);
        }}
      />
      <SetlistExportOptionsDialog
        open={showExportOptions}
        onOpenChange={setShowExportOptions}
        onExport={confirmExport}
      />
    </div>
  );
}
