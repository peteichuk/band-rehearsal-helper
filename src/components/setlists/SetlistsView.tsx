import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download,
  GripVertical,
  LayoutGrid,
  List,
  ListMusic,
  MoreVertical,
  Plus,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleButtonPair } from '@/components/shared/ToggleButtonPair';
import { SearchBar } from '@/components/song-list/SearchBar';
import { SwipeToDeleteRow } from '@/components/shared/SwipeToDeleteRow';
import { ScrollToTopButton } from '@/components/shared/ScrollToTopButton';
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
import { useDragReorder } from '@/hooks/useDragReorder';
import { useGridDragReorder } from '@/hooks/useGridDragReorder';
import {
  downloadSetlistAsFile,
  downloadSetlistsAsFile,
  parseSetlistsFile,
  type SetlistBundleExtras,
} from '@/lib/setlistFileTransfer';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { saveSetlistSongsScrollTop, saveSetlistsScrollTop } from '@/lib/scrollMemory';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    allSetlists,
    createSetlist,
    deleteSetlist,
    findSetlistByName,
    importSetlist,
    addSongToSetlist,
    reorderSetlists,
  } = useLocalSetlists();
  const dragReorder = useDragReorder({
    items: allSetlists.map(setlist => setlist.id),
    onReorder: reorderSetlists,
  });
  const gridDragReorder = useGridDragReorder({
    items: allSetlists.map(setlist => setlist.id),
    onReorder: reorderSetlists,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConflict, setImportConflict] = useState<{
    name: string;
    resolve: (result: { choice: ImportConflictChoice; applyToAll: boolean }) => void;
  } | null>(null);

  // tableId (and anything else already in the URL) has to ride along, or
  // the setlist page loses it and the catalog it needs to resolve songs from.
  // Scroll position is saved here (restored by SongListPage on return) —
  // the setlist itself always opens at its own top, so its own song-list
  // scroll memory is reset here too (otherwise a leftover value from a
  // *previous* setlist visit could leak into this fresh one).
  const openSetlist = (setlistId: string) => {
    saveSetlistsScrollTop(window.scrollY);
    saveSetlistSongsScrollTop(0);
    navigate(`/setlists/${encodeURIComponent(setlistId)}?${searchParams.toString()}`);
  };
  const [displayMode, setDisplayMode] = useLocalStorageState<'tiles' | 'list'>(
    'setlistsDisplayMode',
    'list'
  );
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;
  const visibleSetlists = isSearching
    ? allSetlists.filter(setlist => setlist.name.toLowerCase().includes(query.trim().toLowerCase()))
    : allSetlists;
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
    if (
      window.confirm(
        t('Delete "{{name}}"? This only removes it from this device.', { name: setlist.name })
      )
    ) {
      deleteSetlist(setlist.id);
      showToast(t('Setlist "{{name}}" deleted.', { name: setlist.name }), 'success');
    }
  };

  // The swipe-to-reveal gesture itself is the confirmation here — tapping
  // the revealed red button is already a deliberate second step, so an
  // extra window.confirm on top of it would be redundant. A toast is enough
  // of a notice after the fact.
  const handleSwipeDelete = (setlist: Setlist) => {
    deleteSetlist(setlist.id);
    showToast(t('Setlist "{{name}}" deleted.', { name: setlist.name }), 'success');
  };

  const startExportMode = () => {
    setSelectedForExport(new Set());
    setQuery('');
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
    showToast(t('Exported {{count}} setlist(s).', { count: selected.length }), 'success');
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
        showToast(t('Imported {{count}} setlist(s).', { count: importedCount }), 'success');
      } else if (cancelled) {
        showToast(t('Import cancelled.'), 'info');
      }
    } catch (err) {
      showToast(t('Import failed: {{message}}', { message: (err as Error).message }), 'error');
    }
  };

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-2 px-2 bg-white dark:bg-gray-900 pt-2 pb-2 mb-2">
        <div className="flex items-center justify-between gap-2">
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
                  {t('Select all')}
                </label>
                <button
                  type="button"
                  onClick={cancelExportMode}
                  className="py-[9px] px-4 flex items-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  {t('Cancel')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowExportOptions(true)}
                disabled={selectedForExport.size === 0}
                className="py-2.5 px-4 flex items-center gap-1.5 rounded bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
              >
                <Upload className="w-5 h-5" />
                {t('Export')}
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
                  { value: 'tiles', label: t('Tiles'), icon: <LayoutGrid className="w-5 h-5" /> },
                  { value: 'list', label: t('List'), icon: <List className="w-5 h-5" /> },
                ]}
              />

              <div className="flex-1 min-w-0">
                <SearchBar value={query} onChange={setQuery} placeholder={t('Search setlists…')} />
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      title={t('More options')}
                      className="p-[9px] flex items-center justify-center rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-muted dark:hover:bg-input/50"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsCreateOpen(true)}>
                      <Plus className="size-5" />
                      {t('New setlist')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                      <Download className="size-5" />
                      {t('Import setlist')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={startExportMode}
                      disabled={allSetlists.length === 0}
                    >
                      <Upload className="size-5" />
                      {t('Export setlists')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
      </div>

      {allSetlists.length === 0 && (
        <EmptyState
          title={t('No setlists yet')}
          message={t('Create one with "New setlist", or add a song to a setlist from its ⋮ menu.')}
        />
      )}

      {allSetlists.length > 0 && visibleSetlists.length === 0 && (
        <EmptyState title={t('No setlists found')} />
      )}

      {visibleSetlists.length > 0 && effectiveDisplayMode === 'tiles' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleSetlists.map(setlist => {
            const isDraggingTile = gridDragReorder.draggingName === setlist.id;
            return (
              <div
                key={setlist.id}
                ref={gridDragReorder.setCellRef(setlist.id)}
                role="button"
                tabIndex={0}
                onClick={() => openSetlist(setlist.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openSetlist(setlist.id);
                  }
                }}
                // shadow (not shadow-sm) for more lift on light — a flat white
                // tile barely read as its own card otherwise. ring-1
                // ring-foreground/10 — same "surface outline" every floating
                // panel in the app uses (DialogContent, SelectContent,
                // DropdownMenuContent): box-shadow is invisible against a dark
                // background, so without it a dark tile was indistinguishable
                // from the page behind it.
                className={cn(
                  'relative cursor-pointer rounded-lg bg-white dark:bg-gray-900 shadow hover:shadow-lg ring-1 ring-foreground/10 dark:hover:bg-gray-800 p-3 flex flex-col items-center gap-1 text-center transition-shadow',
                  // No scale-* here — Tailwind v4 compiles it to the native
                  // CSS `scale` property, which composes with (multiplies)
                  // the inline `transform: translate()` trackPointer sets
                  // during drag, so the tile drifted further from the
                  // pointer the farther it moved. shadow-xl alone still
                  // reads as "lifted".
                  // z-30, not z-10 — clears the sticky search/toolbar's z-20
                  isDraggingTile && 'z-30 shadow-xl'
                )}
              >
                {!isSearching && (
                  <button
                    type="button"
                    title={t('Drag to reorder')}
                    onPointerDown={gridDragReorder.getHandleProps(setlist.id).onPointerDown}
                    onClick={event => event.stopPropagation()}
                    className={cn(
                      'absolute top-1 left-1 p-1.5 flex items-center justify-center rounded text-gray-400 touch-none',
                      isDraggingTile ? 'cursor-grabbing text-blue-500' : 'cursor-grab'
                    )}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute top-1 right-1 flex items-center gap-0.5">
                  <button
                    type="button"
                    title={t('Share setlist')}
                    onClick={event => {
                      event.stopPropagation();
                      downloadSetlistAsFile(setlist);
                    }}
                    className="p-1.5 flex items-center justify-center rounded hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={t('Delete setlist')}
                    onClick={event => {
                      event.stopPropagation();
                      confirmDeleteSetlist(setlist);
                    }}
                    className="p-1.5 flex items-center justify-center rounded text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ListMusic className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium break-words">{setlist.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('{{count}} song(s)', { count: songCount(setlist.id) })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {visibleSetlists.length > 0 && effectiveDisplayMode === 'list' && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {visibleSetlists.map(setlist => {
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
                className="w-full px-2 py-1 flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                <span className="flex-1 min-w-0 truncate font-medium">{setlist.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {t('{{count}} song(s)', { count: songCount(setlist.id) })}
                </span>
                {!isExportMode && (
                  <button
                    type="button"
                    title={t('Share setlist')}
                    onClick={event => {
                      event.stopPropagation();
                      downloadSetlistAsFile(setlist);
                    }}
                    className="shrink-0 p-2.5 flex items-center justify-center rounded hover:text-blue-600 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );

            const content = isExportMode ? (
              <div>{row}</div>
            ) : (
              <SwipeToDeleteRow onDelete={() => handleSwipeDelete(setlist)}>{row}</SwipeToDeleteRow>
            );

            const isDragging = dragReorder.draggingName === setlist.id;

            return (
              <div
                key={setlist.id}
                ref={dragReorder.setRowRef(setlist.id)}
                className={cn(
                  'flex items-center gap-1 transition-shadow',
                  // No scale-* — see the tile drag className's comment above.
                  // z-30, not z-10 — clears the sticky search/toolbar's z-20.
                  isDragging && 'relative z-30 shadow-xl bg-white dark:bg-gray-900'
                )}
              >
                {!isExportMode && !isSearching && (
                  <button
                    type="button"
                    title={t('Drag to reorder')}
                    onPointerDown={dragReorder.getHandleProps(setlist.id).onPointerDown}
                    className={cn(
                      'shrink-0 py-2.5 w-7 flex items-center justify-center text-gray-400 touch-none',
                      isDragging ? 'cursor-grabbing text-blue-500' : 'cursor-grab'
                    )}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                )}
                <div className="flex-1 min-w-0">{content}</div>
              </div>
            );
          })}
        </div>
      )}

      {!isExportMode && <ScrollToTopButton />}

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
