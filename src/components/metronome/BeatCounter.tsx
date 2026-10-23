interface BeatCounterProps {
  /** 0-indexed, as the engine tracks it; displayed 1-indexed. */
  currentBeat: number | null;
  beatsPerBar: number;
}

export function BeatCounter({ currentBeat, beatsPerBar }: BeatCounterProps) {
  return (
    // Fixed width (wide enough for the largest meter, 13/8 etc.) so neighboring
    // buttons in the row don't shift every time the digit count itself changes
    // (1 vs 2 digits) as the beat advances or the time signature changes.
    // Right-aligned so the static "/ N" stays pinned in place — only the
    // ever-changing beat number (to its left) ever actually moves.
    <div className="flex w-[4.5rem] items-baseline justify-end gap-1" aria-hidden="true">
      <span className="text-2xl font-bold tabular-nums leading-none">
        {currentBeat === null ? '–' : currentBeat + 1}
      </span>
      <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{`/ ${beatsPerBar}`}</span>
    </div>
  );
}
