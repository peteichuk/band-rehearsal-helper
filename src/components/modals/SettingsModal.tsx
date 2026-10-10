import { useRef, useState, useSyncExternalStore } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportedSettings {
  version: 1;
  exportedAt: string;
  favorites: string[];
  pinOverrides: PinOverrides;
  customGroups: LocalGroups;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const favorites = useSyncExternalStore(subscribeLocalFavorites, getLocalFavoritesSnapshot);
  const pinOverrides = useSyncExternalStore(subscribePinOverrides, getPinOverridesSnapshot);
  const pinOverrideCount = Object.keys(pinOverrides).length;
  const customGroups = useSyncExternalStore(subscribeLocalGroups, getLocalGroupsSnapshot);
  const customGroupedSongsCount = Object.keys(customGroups).length;

  const handleExport = () => {
    const data: ExportedSettings = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: getLocalFavorites(),
      pinOverrides: getPinOverrides(),
      customGroups: getAllLocalGroups(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `band-rehearsal-helper-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ExportedSettings>;

      let favoritesImported = 0;
      let pinsImported = 0;
      let groupsImported = 0;

      if (Array.isArray(parsed.favorites)) {
        const merged = new Set([...getLocalFavorites(), ...parsed.favorites]);
        setLocalFavorites(Array.from(merged));
        favoritesImported = parsed.favorites.length;
      }

      if (parsed.pinOverrides && typeof parsed.pinOverrides === 'object') {
        setPinOverrides({ ...getPinOverrides(), ...parsed.pinOverrides });
        pinsImported = Object.keys(parsed.pinOverrides).length;
      }

      if (parsed.customGroups && typeof parsed.customGroups === 'object') {
        const merged: LocalGroups = { ...getAllLocalGroups() };
        for (const [songName, labels] of Object.entries(parsed.customGroups)) {
          const existing = merged[songName] ?? [];
          const toAdd = labels.filter(
            label => !existing.some(e => e.toLowerCase() === label.toLowerCase())
          );
          merged[songName] = [...existing, ...toAdd];
        }
        setAllLocalGroups(merged);
        groupsImported = Object.keys(parsed.customGroups).length;
      }

      if (!favoritesImported && !pinsImported && !groupsImported) {
        throw new Error('Invalid file: no "favorites", "pinOverrides" or "customGroups" found');
      }
      setMessage(
        `Imported ${favoritesImported} favorite(s), ${pinsImported} pin override(s), ${groupsImported} song(s) with custom groups.`
      );
    } catch (err) {
      setMessage(`Import failed: ${(err as Error).message}`);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Settings</DialogTitle>

        <div className="space-y-4">
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
            <h3 className="text-sm font-semibold mb-1">Backup</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Export favorites, pin overrides and custom groups together to share with bandmates, or
              import a file they sent you (merges with what you already have).
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleExport}>
                Export
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Import
              </Button>
            </div>
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

          {message && <p className="text-xs text-gray-600 dark:text-gray-300">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
