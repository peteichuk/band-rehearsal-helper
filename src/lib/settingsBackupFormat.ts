import type { PinOverrides } from '@/lib/localPins';
import type { LocalGroups } from '@/lib/localGroups';
import type { MetronomePreset } from '@/lib/metronomePresets';
import type { SetlistSongEntry } from '@/lib/localSetlists';
import type { Orientation, OrientationDisplayConfig } from '@/lib/songDisplayConfig';

export type AppearanceDefaults = Record<Orientation, OrientationDisplayConfig>;
export type ExportedSetlist = { name: string; songs: SetlistSongEntry[] };

/**
 * The shared shape for both the all-songs Settings → Backup export and a
 * single song's own export (`songSettingsTransfer.ts`) — a per-song file is
 * just this same format with every per-song `Record<songName, …>` field
 * filtered down to one key, so either kind of file imports cleanly through
 * either flow.
 */
export interface ExportedSettings {
  version: 2;
  exportedAt: string;
  favorites?: string[];
  pinOverrides?: PinOverrides;
  customGroups?: LocalGroups;
  tonalityPrefs?: Record<string, string>;
  lineNotes?: Record<string, Record<string, string>>;
  setlists?: ExportedSetlist[];
  appearanceDefaults?: AppearanceDefaults;
  metronomePresets?: Record<string, MetronomePreset>;
}
