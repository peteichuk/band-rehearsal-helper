import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { selectionAwareClick } from '@/lib/selectionAwareClick';
import { splitLineIntoSegments, isChordLine } from '@/lib/chords/parseLine';
import { formatChordNotation, transposeChord, type ChordNotation } from '@/lib/chords/transpose';
import { ChordDiagram } from '@/components/chords/ChordDiagram';
import type { ChordInstrument } from '@/lib/chords/chordDiagrams';
import { InlineNote } from '@/components/song-detail/InlineNote';

interface ChordLineProps {
  line: string;
  steps: number;
  useFlats: boolean;
  hideTextLine: boolean;
  hideChordLine: boolean;
  note?: string;
  onLineClick?: () => void;
  fontSize?: number;
  /** When set, chords become tappable (opening their diagram) instead of inert text. */
  onChordClick?: (chord: string, element: HTMLElement) => void;
  /** When set, a small diagram for this instrument is drawn right next to every chord. */
  inlineDiagramInstrument?: ChordInstrument;
  /** Multiplier on the inline diagram's size (1 = default). */
  diagramScale?: number;
  chordNotation?: ChordNotation;
}

export function ChordLine({
  line,
  steps,
  useFlats,
  hideTextLine,
  hideChordLine,
  note,
  onLineClick,
  fontSize,
  onChordClick,
  inlineDiagramInstrument,
  diagramScale = 1,
  chordNotation = 'american',
}: ChordLineProps) {
  if (line.trim() === '') return null;

  const segments = splitLineIntoSegments(line);
  const chordLine = isChordLine(line);

  if (chordLine && hideChordLine) return null;
  if (!chordLine && hideTextLine) return null;

  const handleClick = onLineClick ? selectionAwareClick(onLineClick) : undefined;

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'leading-none',
          // When text lines are hidden, remaining chord lines no longer need to
          // preserve the whitespace that aligned them with lyrics above/below.
          chordLine && hideTextLine ? 'whitespace-normal' : 'whitespace-pre-wrap',
          chordLine ? 'chord-line text-blue-600 dark:text-blue-400' : 'text-line',
          onLineClick &&
            '-mx-1 cursor-pointer rounded px-1 active:bg-amber-100 dark:active:bg-amber-900/40',
          note &&
            '-ml-1 border-l-2 border-amber-400 bg-amber-50 pl-1 dark:border-amber-500 dark:bg-amber-950/30'
        )}
      >
        {segments.map((segment, index) =>
          segment.type === 'chord' ? (
            <ChordToken
              key={index}
              chord={transposeChord(segment.value, steps, useFlats)}
              onChordClick={onChordClick}
              inlineDiagramInstrument={inlineDiagramInstrument}
              fontSize={fontSize}
              diagramScale={diagramScale}
              chordNotation={chordNotation}
            />
          ) : (
            <Fragment key={index}>{segment.value}</Fragment>
          )
        )}
      </div>
      {note && <InlineNote note={note} onClick={handleClick} fontSize={fontSize} />}
    </>
  );
}

/** Inline diagram width per px of text size, so it grows/shrinks with the lyrics. */
const INLINE_WIDTH_PER_FONT_PX = 2.6;
const DEFAULT_FONT_SIZE = 16;

function ChordToken({
  chord,
  onChordClick,
  inlineDiagramInstrument,
  fontSize,
  diagramScale,
  chordNotation,
}: {
  chord: string;
  onChordClick?: (chord: string, element: HTMLElement) => void;
  inlineDiagramInstrument?: ChordInstrument;
  fontSize?: number;
  diagramScale: number;
  chordNotation: ChordNotation;
}) {
  // `chord` stays canonical (American) for diagram lookup; only the shown text is re-spelled.
  const displayName = formatChordNotation(chord, chordNotation);
  const label = inlineDiagramInstrument ? (
    <span className="inline-flex items-end gap-1 align-bottom">
      {displayName}
      <ChordDiagram
        chord={chord}
        instrument={inlineDiagramInstrument}
        width={(fontSize ?? DEFAULT_FONT_SIZE) * INLINE_WIDTH_PER_FONT_PX * diagramScale}
      />
    </span>
  ) : (
    displayName
  );

  if (!onChordClick) {
    return <span className="chord text-blue-600 dark:text-blue-400">{label}</span>;
  }
  return (
    <span
      role="button"
      className="chord cursor-pointer text-blue-600 dark:text-blue-400"
      onClick={event => {
        // Don't also open the line's note editor, which listens on the parent.
        event.stopPropagation();
        onChordClick(chord, event.currentTarget);
      }}
    >
      {label}
    </span>
  );
}
