import { useSyncExternalStore } from 'react';
import { useOrientation } from '@/hooks/useOrientation';
import {
  getEffectiveConfig,
  setSongColumnClass,
  setSongFontSize,
  subscribeSongDisplayConfig,
  getSongDisplayConfigSnapshot,
} from '@/lib/songDisplayConfig';

/**
 * The font size/column count actually shown for this song right now: its own
 * per-orientation override if it has one, the global Appearance default
 * otherwise. Adjusting either control on the song page writes a per-song
 * override, never the global default.
 */
export function useSongDisplayConfig(songName: string) {
  const orientation = useOrientation();
  // Re-renders on any defaults/overrides change — getEffectiveConfig below
  // then reads the already-updated module state.
  useSyncExternalStore(subscribeSongDisplayConfig, getSongDisplayConfigSnapshot);
  const effective = getEffectiveConfig(songName, orientation);

  return {
    orientation,
    fontSize: effective.fontSize,
    columnClass: effective.columnClass,
    setFontSize: (fontSize: number) => setSongFontSize(songName, orientation, fontSize),
    setColumnClass: (columnClass: string) => setSongColumnClass(songName, orientation, columnClass),
  };
}
