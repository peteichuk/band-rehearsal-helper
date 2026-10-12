import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { selectionAwareClick } from '@/lib/selectionAwareClick';
import { splitLineIntoSegments, isChordLine } from '@/lib/chords/parseLine';
import { transposeChord } from '@/lib/chords/transpose';
import { InlineNote } from '@/components/song-detail/InlineNote';

interface ChordLineProps {
  line: string;
  steps: number;
  useFlats: boolean;
  hideTextLine: boolean;
  hideChordLine: boolean;
  note?: string;
  onLineClick?: () => void;
}

export function ChordLine({
  line,
  steps,
  useFlats,
  hideTextLine,
  hideChordLine,
  note,
  onLineClick,
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
            <span key={index} className="chord text-blue-600 dark:text-blue-400">
              {transposeChord(segment.value, steps, useFlats)}
            </span>
          ) : (
            <Fragment key={index}>{segment.value}</Fragment>
          )
        )}
      </div>
      {note && handleClick && <InlineNote note={note} onClick={handleClick} />}
    </>
  );
}
