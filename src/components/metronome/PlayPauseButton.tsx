import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function PlayPauseButton({ isPlaying, onToggle }: PlayPauseButtonProps) {
  return (
    <Button
      type="button"
      size="icon-lg"
      variant="outline"
      className="py-3.5 px-6 text-orange-500 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-400"
      onClick={onToggle}
    >
      {isPlaying ? <Pause /> : <Play />}
      <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
    </Button>
  );
}
