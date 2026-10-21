import { cn } from 'cn';
import type { BeatLevel } from '@/components/metronome/timeSignatures';

interface BeatAccentEditorProps {
  beatsPerBar: number;
  currentBeat: number | null;
  /** The Custom pattern's own per-beat levels — unlike BeatIndicator, this one actually uses 'mute'/'medium'. */
  levels: BeatLevel[];
  onLevelChange: (beatIndex: number) => void;
}

const LEVEL_LABEL: Record<BeatLevel, string> = {
  mute: 'muted',
  normal: 'normal',
  medium: 'medium accent',
  accent: 'full accent',
};

/** Vertical fill height for each level — mute stays empty (just the dashed outline), the 3 audible levels climb in thirds. */
const LEVEL_FILL_PERCENT: Record<BeatLevel, number> = {
  mute: 0,
  normal: 33,
  medium: 66,
  accent: 100,
};

/**
 * Taller, tappable beat buttons for the Custom accent pattern — swapped in
 * for the plain BeatIndicator dots only while editing a custom pattern.
 * Tapping cycles mute → normal → medium → accent → mute; the fill climbs in
 * thirds from the bottom to show which level is set, mute showing as an
 * empty dashed outline.
 */
export function BeatAccentEditor({
  beatsPerBar,
  currentBeat,
  levels,
  onLevelChange,
}: BeatAccentEditorProps) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-1.5" role="group">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const level = levels[beat] ?? 'normal';
        const isActive = beat === currentBeat;
        const isMute = level === 'mute';
        return (
          <div key={beat} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onLevelChange(beat)}
              aria-label={`Beat ${beat + 1}: ${LEVEL_LABEL[level]}`}
              aria-pressed={!isMute}
              className={cn(
                'relative h-10 w-7 shrink-0 overflow-hidden rounded-md border-2 bg-muted/40 transition-colors',
                isMute ? 'border-dashed border-muted-foreground/40' : 'border-transparent',
                isActive && 'ring-2 ring-primary ring-offset-1'
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 bg-orange-600 transition-[height]"
                style={{ height: `${LEVEL_FILL_PERCENT[level]}%` }}
              />
            </button>
            <span className="text-[10px] text-muted-foreground">{beat + 1}</span>
          </div>
        );
      })}
    </div>
  );
}
