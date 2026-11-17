import { useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { useBeatFlash } from '@/components/metronome/useBeatFlash';
import type { BeatLevel } from '@/components/metronome/timeSignatures';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  /** The button always pulses in time with the beat (stronger beat → brighter pulse), independent of the screen-flash toggle. */
  currentBeat: number | null;
  accentPattern: BeatLevel[];
}

export function PlayPauseButton({
  isPlaying,
  onToggle,
  currentBeat,
  accentPattern,
}: PlayPauseButtonProps) {
  const flashRef = useRef<HTMLSpanElement>(null);
  useBeatFlash(flashRef, true, currentBeat, accentPattern);

  return (
    <Button
      type="button"
      size="icon-lg"
      variant="outline"
      className={cn(
        'relative overflow-hidden py-3.5 px-6 text-orange-500 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-400',
        // Border matches the icon color while the metronome is running.
        isPlaying && 'border-orange-500 dark:border-orange-400'
      )}
      onClick={onToggle}
    >
      <span
        ref={flashRef}
        aria-hidden="true"
        // Just a small inner edge glow (same idea as the screen frame, only
        // smaller) — not a background fill, so the button itself stays put.
        style={{ boxShadow: 'inset 0 0 8px 1px currentColor' }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] text-orange-500 opacity-0"
      />
      {isPlaying ? <Pause /> : <Play />}
      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
    </Button>
  );
}
