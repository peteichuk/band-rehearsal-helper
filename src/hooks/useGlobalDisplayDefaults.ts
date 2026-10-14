import { useSyncExternalStore } from 'react';
import { useOrientation } from '@/hooks/useOrientation';
import {
  getGlobalDefault,
  setGlobalColumnClass,
  setGlobalFontSize,
  subscribeSongDisplayConfig,
  getSongDisplayConfigSnapshot,
  type Orientation,
} from '@/lib/songDisplayConfig';

/**
 * Settings → Appearance: the global font size/column default for one
 * specific orientation — editable regardless of how the device is currently
 * held, so both portrait and landscape can be set up without rotating.
 */
export function useGlobalDisplayDefaultsFor(orientation: Orientation) {
  useSyncExternalStore(subscribeSongDisplayConfig, getSongDisplayConfigSnapshot);
  const current = getGlobalDefault(orientation);

  return {
    orientation,
    fontSize: current.fontSize,
    columnClass: current.columnClass,
    setFontSize: (fontSize: number) => setGlobalFontSize(orientation, fontSize),
    setColumnClass: (columnClass: string) => setGlobalColumnClass(orientation, columnClass),
  };
}

/** Same, but for the device's *current* orientation — used to seed a song's own "reset" target. */
export function useGlobalDisplayDefaults() {
  const orientation = useOrientation();
  return useGlobalDisplayDefaultsFor(orientation);
}
