import { formatChordNotation, type ChordNotation } from '@/lib/chords/transpose';
import { ChordDiagram } from '@/components/chords/ChordDiagram';
import type { ChordInstrument } from '@/lib/chords/chordDiagrams';

interface ChordStripProps {
  /** Unique chords of the song, as displayed (transposed), in order of first appearance. */
  chords: string[];
  instrument: ChordInstrument;
  /** Multiplier from the diagram size +/- control (1 = default). */
  scale: number;
  chordNotation: ChordNotation;
}

/** Fixed (smallish) diagram size — unlike the tap popover, this doesn't follow the song's text size. */
const STRIP_DIAGRAM_WIDTH = 45;

export function ChordStrip({ chords, instrument, scale, chordNotation }: ChordStripProps) {
  if (chords.length === 0) return null;
  return (
    <div className="print:hidden mt-4 flex flex-wrap items-end gap-x-3 gap-y-2 rounded border border-blue-200 p-2 dark:border-blue-900">
      {chords.map(chord => (
        <div key={chord} className="flex flex-col items-center gap-1">
          <strong className="text-xs text-blue-600 dark:text-blue-400">
            {formatChordNotation(chord, chordNotation)}
          </strong>
          <ChordDiagram chord={chord} instrument={instrument} width={STRIP_DIAGRAM_WIDTH * scale} />
        </div>
      ))}
    </div>
  );
}
