import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function PlayPauseButton({ isPlaying, onToggle }: PlayPauseButtonProps) {
  return (
    <Button type="button" size="icon-lg" variant="secondary" onClick={onToggle}>
      {isPlaying ? <Pause /> : <Play />}
      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
    </Button>
  );
}
