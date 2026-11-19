import { useSyncExternalStore } from 'react';
import type { BeatLevel } from '@/components/metronome/timeSignatures';

/**
 * A read/control handle on the one metronome engine, published by
 * `LocalMetronomePanel` (where the engine lives) so UI *outside* it — the
 * Play-mode bar — can show its state and toggle it, without the engine
 * having to be lifted out of the panel.
 *
 * Deliberately a tiny external store instead of React state in `App`: the
 * snapshot changes on every beat, and re-rendering the whole route tree
 * (song text and all) a few times a second just to move a button's glow
 * would be wasteful — only components that subscribe re-render.
 */
export interface MetronomeControl {
  isPlaying: boolean;
  /** Index of the beat that just sounded, null while stopped. */
  currentBeat: number | null;
  accentPattern: BeatLevel[];
  bpm: number;
  /** Whether the current song has a tempo of its own (sheet BPM or a saved preset) — false means `bpm` is just the default tempo. */
  hasOwnTempo: boolean;
  /** Time between two clicks, in ms (60000 / bpm / beatUnitScale) — what a beat-synced animation has to span. */
  beatIntervalMs: number;
  /** Display label of the current time signature, e.g. "4/4". */
  timeSignatureLabel: string;
  toggle: () => void;
}

let current: MetronomeControl | null = null;
const listeners = new Set<() => void>();

/** Called by the panel on every relevant change; `null` when it unmounts. */
export function publishMetronomeControl(next: MetronomeControl | null) {
  current = next;
  listeners.forEach(listener => listener());
}

/** Stops the metronome if it's running (no-op otherwise) — for UI that wants a one-tap "stop" without owning the engine. */
export function stopMetronome() {
  if (current?.isPlaying) current.toggle();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return current;
}

/** `null` until the metronome panel has mounted (it mounts lazily, see useMetronome). */
export function useMetronomeControl(): MetronomeControl | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}
