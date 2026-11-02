import { StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

// text-xs's own ratio to the song's 16px default — kept as a multiplier so a
// note stays proportionally smaller than the lyrics at any zoom level.
const NOTE_SIZE_RATIO = 0.75;

interface InlineNoteProps {
  note: string;
  onClick: () => void;
  /** The surrounding song text's current font size (px) — scaled down so the note tracks the song's own zoom instead of staying fixed at text-xs. */
  fontSize?: number;
}

/** Always-visible note row — a cue like "I come in here" needs to be readable at a glance, not hidden behind a tap. */
export function InlineNote({ note, onClick, fontSize }: InlineNoteProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        '-mt-0.5 mb-0.5 flex cursor-pointer items-start gap-1 pl-1 leading-snug text-amber-700 italic whitespace-normal dark:text-amber-400',
        // text-xs is a fixed, root-relative rem size — a no-op once an inline
        // fontSize style is set below, but still needed as the fallback when
        // the caller doesn't pass one.
        !fontSize && 'text-xs'
      )}
      style={fontSize ? { fontSize: `${fontSize * NOTE_SIZE_RATIO}px` } : undefined}
    >
      <StickyNote className="mt-0.5 size-3 shrink-0" />
      <span>{note}</span>
    </div>
  );
}
