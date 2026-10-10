import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { splitLineIntoSegments, isChordLine } from '@/lib/chords/parseLine';
import { transposeChord } from '@/lib/chords/transpose';

interface ChordLineProps {
  line: string;
  steps: number;
  useFlats: boolean;
  hideTextLine: boolean;
  hideChordLine: boolean;
}

export function ChordLine({ line, steps, useFlats, hideTextLine, hideChordLine }: ChordLineProps) {
  if (line.trim() === '') return null;

  const segments = splitLineIntoSegments(line);
  const chordLine = isChordLine(line);

  if (chordLine && hideChordLine) return null;
  if (!chordLine && hideTextLine) return null;

  return (
    <div
      className={cn(
        'leading-none',
        // When text lines are hidden, remaining chord lines no longer need to
        // preserve the whitespace that aligned them with lyrics above/below.
        chordLine && hideTextLine ? 'whitespace-normal' : 'whitespace-pre-wrap',
        chordLine ? 'chord-line text-blue-600 dark:text-blue-400' : 'text-line'
      )}
    >
      {segments.map((segment, index) =>
        segment.type === 'chord' ? (
          <span key={index} className="chord text-blue-600 dark:text-blue-400">
            {transposeChord(segment.value, steps, useFlats)}
          </span>
        ) : (
          <Fragment key={index}>{segment.value}</Fragment>
        )
      )}
    </div>
  );
}
