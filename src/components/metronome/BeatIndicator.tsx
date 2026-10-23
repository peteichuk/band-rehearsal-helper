import { Fragment } from 'react';
import { cn } from 'cn';
import type { BeatLevel } from '@/components/metronome/timeSignatures';

interface BeatIndicatorProps {
  beatsPerBar: number;
  currentBeat: number | null;
  /** See TimeSignature.AccentPattern — one entry per beat. Only ever fed static (non-custom) patterns, so 'mute' never actually appears here. */
  accentPattern: BeatLevel[];
}

export function BeatIndicator({ beatsPerBar, currentBeat, accentPattern }: BeatIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="presentation">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const isAccent = accentPattern[beat] === 'accent';
        const isActive = beat === currentBeat;
        return (
          <Fragment key={beat}>
            {/* A divider (instead of a plain gap) before each accented beat
                but the first, so the dots visibly read as whatever grouping
                the selected accent pattern implies (e.g. 3+3+3+3 for 12/8),
                not a flat row. */}
            {beat !== 0 && isAccent && <span className="h-4 w-px bg-border" aria-hidden="true" />}
            <span
              className={cn(
                // No color transition here — it has to flip the instant the
                // click plays, not fade in a beat late.
                'size-3 rounded-full bg-muted',
                isAccent && 'size-3.5',
                isActive && (isAccent ? 'bg-orange-600' : 'bg-primary')
              )}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
