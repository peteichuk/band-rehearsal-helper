import type { PianoChord } from '@/lib/chords/chordDiagrams';

interface PianoDiagramProps {
  chord: PianoChord;
  /** Rendered width in px — height follows from the viewBox's aspect ratio. */
  width: number;
}

const OCTAVES = 2;
const WHITE_CHROMAS = [0, 2, 4, 5, 7, 9, 11];
// Black key → how many white keys from the start of its octave it sits after.
const BLACK_KEYS: { chroma: number; afterWhite: number }[] = [
  { chroma: 1, afterWhite: 1 },
  { chroma: 3, afterWhite: 2 },
  { chroma: 6, afterWhite: 4 },
  { chroma: 8, afterWhite: 5 },
  { chroma: 10, afterWhite: 6 },
];

const WHITE_W = 10;
const WHITE_H = 40;
const BLACK_W = 6.4;
const BLACK_H = 24;

/** Two octaves of keys with the chord's tones highlighted (root in orange, like the metronome accent). */
export function PianoDiagram({ chord, width }: PianoDiagramProps) {
  const viewWidth = WHITE_CHROMAS.length * OCTAVES * WHITE_W;
  const isTone = (chroma: number) => chord.chromas.includes(chroma);
  const fillFor = (chroma: number, base: string) =>
    chroma === chord.rootChroma ? '#ea580c' : isTone(chroma) ? '#3b82f6' : base;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${WHITE_H}`}
      width={width}
      height={(width * WHITE_H) / viewWidth}
      className="text-gray-800 dark:text-gray-200"
      role="img"
    >
      {Array.from({ length: WHITE_CHROMAS.length * OCTAVES }, (_, i) => {
        const chroma = WHITE_CHROMAS[i % WHITE_CHROMAS.length];
        return (
          <rect
            key={i}
            x={i * WHITE_W}
            y={0}
            width={WHITE_W}
            height={WHITE_H}
            fill={fillFor(chroma, 'white')}
            stroke="#6b7280"
            strokeWidth={0.6}
          />
        );
      })}
      {Array.from({ length: OCTAVES }, (_, octave) =>
        BLACK_KEYS.map(({ chroma, afterWhite }) => (
          <rect
            key={`${octave}-${chroma}`}
            x={(octave * WHITE_CHROMAS.length + afterWhite) * WHITE_W - BLACK_W / 2}
            y={0}
            width={BLACK_W}
            height={BLACK_H}
            rx={0.8}
            fill={fillFor(chroma, '#1f2937')}
            stroke="#111827"
            strokeWidth={0.4}
          />
        ))
      )}
    </svg>
  );
}
