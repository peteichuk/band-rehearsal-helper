import { useMemo, useSyncExternalStore } from 'react';
import { getPinOverridesSnapshot, subscribePinOverrides, togglePinOverride } from '@/lib/localPins';
import { isEffectivelyPinned, resolveEffectivePins } from '@/lib/songs/effectivePins';
import type { Song } from '@/types/song';

export function usePinOverrides() {
  return useSyncExternalStore(subscribePinOverrides, getPinOverridesSnapshot);
}

/**
 * The full set of currently-pinned song names (sheet default + local overrides), for sorting.
 * Memoized on [songs, overrides] — both are stable references unless the data
 * or the overrides actually change, so this skips recomputation on re-renders
 * triggered by unrelated state (e.g. typing in search, which touches the URL
 * that RootLayout also reads from).
 */
export function useEffectivePinsSet(songs: Song[]): Set<string> {
  const overrides = usePinOverrides();
  return useMemo(() => resolveEffectivePins(songs, overrides), [songs, overrides]);
}

/** Pin state + toggle for a single song, e.g. a list row or the detail page. */
export function useSongPin(song: Song) {
  const overrides = usePinOverrides();
  const pinned = isEffectivelyPinned(song, overrides);

  return {
    isPinned: pinned,
    togglePin: () => togglePinOverride(song.Name, pinned),
  };
}
