import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  deleteMetronomePreset,
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
 * - `updateSynced` only touches local state now — nothing reaches the
 *   store until `save` is called explicitly (the metronome's own Save
 *   button, shown whenever a song is open), so tweaking tempo/meter/accent
 *   while experimenting never overwrites what was last saved for the song.
 * - A `useSyncExternalStore` subscription means a write from *anywhere
 *   else* (a Settings → Backup reset or Import, editing the same song from
 *   Settings' own song list, this hook's own `save`, …) is picked up too,
 *   even while this stays mounted but hidden behind a closed modal —
 *   including the preset being cleared entirely back to `null`, which
 *   still resolves correctly back to the song's own sheet defaults via
 *   `resolveSyncedPresetFields`.
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

  /** Updates local state only — persisting is now a separate, explicit step (see `save`), so a field can never reach the store just by being edited. */
  const updateSynced = (patch: Partial<MetronomePreset>) => {
    setSynced(prev => ({ ...prev, ...patch }));
  };

  /** Writes the current local edits to the song's saved preset. `extra` lets a caller fold in a field this hook doesn't itself track (e.g. LocalMetronomePanel's soundId) into the same write. The only place `synced` ever reaches the store. */
  const save = (extra?: Partial<MetronomePreset>) => {
    if (songName) setMetronomePreset(songName, { ...synced, ...extra });
  };

  /** True once a local edit hasn't been written back via `save` yet. */
  const isDirty =
    JSON.stringify(synced) !== JSON.stringify(resolveSyncedPresetFields(preset, sheetDefaults));

  /** Discards both the local draft and the saved preset, back to the song's own sheet defaults — the metronome's "Reset" action. Updates local state directly rather than relying on the store-change effect above, since there's nothing to delete (and so nothing to react to) when the draft diverged without ever being saved. */
  const reset = () => {
    setSynced(resolveSyncedPresetFields(null, sheetDefaults));
    if (songName) deleteMetronomePreset(songName);
  };

  // Exposed too — callers that manage a field outside SyncedPresetFields
  // (LocalMetronomePanel's soundId, see the MetronomePreset interface
  // comment) still need the raw preset to read it from and to know when it
  // changed, without subscribing to the store a second time themselves.
  return { synced, updateSynced, preset, save, isDirty, reset };
}
