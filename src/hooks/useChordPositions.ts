import { createContext, useContext, useSyncExternalStore } from 'react';
import {
  getChordPositionsSnapshot,
  hasChordPositionOverride,
  resolveChordPosition,
  subscribeChordPositions,
} from '@/lib/chordPositions';
import type { ChordInstrument } from '@/lib/chords/chordDiagrams';

/** Which song's per-song/temporary fingering choices apply to the diagrams below. */
export const ChordSongContext = createContext<string | null>(null);

export function useChordPosition(instrument: ChordInstrument, chord: string) {
  const songName = useContext(ChordSongContext);
  const snapshot = useSyncExternalStore(subscribeChordPositions, getChordPositionsSnapshot);
  return {
    songName,
    index: resolveChordPosition(snapshot, songName, instrument, chord),
    hasOverride: hasChordPositionOverride(snapshot, songName, instrument, chord),
  };
}
