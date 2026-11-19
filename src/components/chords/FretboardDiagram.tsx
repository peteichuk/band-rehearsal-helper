import type { FretboardPosition } from '@/lib/chords/chordDiagrams';

interface FretboardDiagramProps {
  position: FretboardPosition;
  strings: number;
  frets: number;
  /** Rendered width in px — height follows from the viewBox's aspect ratio. */
  width: number;
}

const STRING_GAP = 16;
const FRET_GAP = 18;
const LEFT = 18;
const TOP = 22;

/** Guitar/ukulele chord box as SVG, drawn in `currentColor` so it follows the theme. */
export function FretboardDiagram({ position, strings, frets, width }: FretboardDiagramProps) {
  const boardWidth = (strings - 1) * STRING_GAP;
  const boardHeight = frets * FRET_GAP;
  const viewWidth = LEFT + boardWidth + 12;
  const viewHeight = TOP + boardHeight + 10;
  const x = (stringIndex: number) => LEFT + stringIndex * STRING_GAP;
  const y = (fret: number) => TOP + (fret - 0.5) * FRET_GAP;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={width}
      height={(width * viewHeight) / viewWidth}
      className="text-gray-800 dark:text-gray-200"
      role="img"
    >
      {/* Nut (thick) when the chord sits at the top of the neck, otherwise a plain line + fret label. */}
      <line
        x1={x(0)}
        x2={x(strings - 1)}
        y1={TOP}
        y2={TOP}
        stroke="currentColor"
        strokeWidth={position.baseFret === 1 ? 2.5 : 1.25}
        vectorEffect="non-scaling-stroke"
      />
      {position.baseFret > 1 && (
        <text x={2} y={TOP + FRET_GAP * 0.65} fontSize={9} fill="currentColor">
          {position.baseFret}
        </text>
      )}
      {Array.from({ length: frets }, (_, i) => (
        <line
          key={i}
          x1={x(0)}
          x2={x(strings - 1)}
          y1={TOP + (i + 1) * FRET_GAP}
          y2={TOP + (i + 1) * FRET_GAP}
          stroke="currentColor"
          strokeWidth={1.25}
          opacity={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {Array.from({ length: strings }, (_, i) => (
        <line
          key={i}
          x1={x(i)}
          x2={x(i)}
          y1={TOP}
          y2={TOP + boardHeight}
          stroke="currentColor"
          strokeWidth={1.25}
          opacity={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {position.barres.map(barreFret => {
        const covered = position.frets
          .map((fret, stringIndex) => (fret === barreFret ? stringIndex : -1))
          .filter(stringIndex => stringIndex >= 0);
        if (covered.length < 2) return null;
        return (
          <line
            key={barreFret}
            x1={x(Math.min(...covered))}
            x2={x(Math.max(...covered))}
            y1={y(barreFret)}
            y2={y(barreFret)}
            stroke="currentColor"
            strokeWidth={9}
            strokeLinecap="round"
          />
        );
      })}

      {position.frets.map((fret, stringIndex) => {
        if (fret === -1) {
          return (
            <text
              key={stringIndex}
              x={x(stringIndex)}
              y={TOP - 7}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={stringIndex}
              cx={x(stringIndex)}
              cy={TOP - 9}
              r={3}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
          );
        }
        return (
          <circle key={stringIndex} cx={x(stringIndex)} cy={y(fret)} r={5} fill="currentColor" />
        );
      })}
    </svg>
  );
}
