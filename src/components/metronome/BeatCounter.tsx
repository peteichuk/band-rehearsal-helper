interface BeatCounterProps {
  /** 0-indexed, as the engine tracks it; displayed 1-indexed. */
  currentBeat: number | null;
  beatsPerBar: number;
}

export function BeatCounter({ currentBeat, beatsPerBar }: BeatCounterProps) {
  return (
    <div className="flex items-baseline gap-1" aria-hidden="true">
      <span className="text-2xl font-bold tabular-nums leading-none">
        {currentBeat === null ? '–' : currentBeat + 1}
      </span>
      <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{`/ ${beatsPerBar}`}</span>
    </div>
  );
}
