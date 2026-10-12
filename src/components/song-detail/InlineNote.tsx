import { StickyNote } from 'lucide-react';

interface InlineNoteProps {
  note: string;
  onClick: () => void;
}

/** Always-visible note row — a cue like "I come in here" needs to be readable at a glance, not hidden behind a tap. */
export function InlineNote({ note, onClick }: InlineNoteProps) {
  return (
    <div
      onClick={onClick}
      className="-mt-0.5 mb-0.5 flex cursor-pointer items-start gap-1 pl-1 text-xs leading-snug text-amber-700 italic whitespace-normal dark:text-amber-400"
    >
      <StickyNote className="mt-0.5 size-3 shrink-0" />
      <span>{note}</span>
    </div>
  );
}
