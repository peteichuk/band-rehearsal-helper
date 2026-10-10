import type { PinOverrides } from '@/lib/localPins';
import type { Song } from '@/types/song';

/**
 * Resolves each song's effective pinned state: the local override if the
 * user has explicitly toggled it, otherwise the sheet's own `PinedByDefault`
 * column.
 */
export function resolveEffectivePins(songs: Song[], overrides: PinOverrides): Set<string> {
  const pinned = new Set<string>();
  for (const song of songs) {
    const override = overrides[song.Name];
    const isPinned = override !== undefined ? override : Boolean(song.PinedByDefault);
    if (isPinned) pinned.add(song.Name);
  }
  return pinned;
}

export function isEffectivelyPinned(song: Song, overrides: PinOverrides): boolean {
  const override = overrides[song.Name];
  return override !== undefined ? override : Boolean(song.PinedByDefault);
}
