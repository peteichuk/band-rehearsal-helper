import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  getMetronomePresetsSnapshot,
  resolveSyncedPresetFields,
  setMetronomePreset,
  subscribeMetronomePresets,
  type MetronomePreset,
  type SyncedPresetFields,
} from '@/lib/metronomePresets';

interface UseSyncedMetronomePresetOptions {
  /** Identifies the song whose preset this is — null skips persistence (no saved preset to read/write). */
  songName: string | null;
  /** What each field falls back to when the song's saved preset doesn't override it (its own sheet BPM/TimeSignature). */
  sheetDefaults: { bpm: number; timeSignatureId: string };
  /**
   * Called whenever this song's preset changed from *outside* this hook's
   * own `updateSynced` — a Settings → Backup reset, an Import, editing the
   * same song's preset from the Settings "Metronome presets" list, etc.
   * Doesn't fire for this hook's own writes, since those already update
   * `synced` directly. Typical use: stop playback, since it'd otherwise
   * keep going with settings that no longer match what's shown.
   */
  onExternalChange?: () => void;
}

/**
 * Keeps a song's metronome preset (everything except `soundId` — see the
 * `MetronomePreset` interface comment in metronomePresets.ts) in sync
 * between localStorage and whatever component is showing it, in both
 * directions:
 *
 * - `updateSynced` writes a local edit to both local state and the saved
 *   preset together, so they can never drift apart.
 * - A `useSyncExternalStore` subscription means a write from *anywhere
 *   else* (a Settings → Backup reset or Import, editing the same song from
 *   Settings' own song list, …) is picked up too, even while this stays
 *   mounted but hidden behind a closed modal — including the preset being
 *   cleared entirely back to `null`, which still resolves correctly back
 *   to the song's own sheet defaults via `resolveSyncedPresetFields`.
 */
export function useSyncedMetronomePreset({
  songName,
  sheetDefaults,
  onExternalChange,
}: UseSyncedMetronomePresetOptions) {
  const allPresets = useSyncExternalStore(subscribeMetronomePresets, getMetronomePresetsSnapshot);
  const preset = songName ? (allPresets[songName] ?? null) : null;

  const [synced, setSynced] = useState<SyncedPresetFields>(() =>
    resolveSyncedPresetFields(preset, sheetDefaults)
  );

  useEffect(() => {
    const next = resolveSyncedPresetFields(preset, sheetDefaults);
    if (JSON.stringify(next) === JSON.stringify(synced)) return;
    setSynced(next);
    onExternalChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  /** Updates local state and the song's saved preset together, in one call — the only way a caller should touch a synced field, so the two can never drift apart. */
  const updateSynced = (patch: Partial<MetronomePreset>) => {
    setSynced(prev => ({ ...prev, ...patch }));
    if (songName) setMetronomePreset(songName, patch);
  };

  // Exposed too — callers that manage a field outside SyncedPresetFields
  // (LocalMetronomePanel's soundId, see the MetronomePreset interface
  // comment) still need the raw preset to read it from and to know when it
  // changed, without subscribing to the store a second time themselves.
  return { synced, updateSynced, preset };
}
