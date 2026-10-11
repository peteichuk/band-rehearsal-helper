import { cn } from 'cn';

interface BeatIndicatorProps {
  beatsPerBar: number;
  currentBeat: number | null;
  accentFirstBeat: boolean;
}

export function BeatIndicator({ beatsPerBar, currentBeat, accentFirstBeat }: BeatIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="presentation">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const isAccent = accentFirstBeat && beat === 0;
        const isActive = beat === currentBeat;
        return (
          <span
            key={beat}
            className={cn(
              'size-3 rounded-full bg-muted transition-colors',
              isAccent && 'size-3.5',
              isActive && (isAccent ? 'bg-orange-600' : 'bg-primary')
            )}
          />
        );
      })}
    </div>
  );
}
