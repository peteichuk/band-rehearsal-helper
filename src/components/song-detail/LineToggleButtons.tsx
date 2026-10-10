import { cn } from '@/lib/utils';
import HideTextIcon from '@/assets/icons/hide-text.svg?react';
import HideChordsIcon from '@/assets/icons/hide-chords.svg?react';

interface LineToggleButtonsProps {
  hideTextLine: boolean;
  hideChordLine: boolean;
  onToggleTextLine: () => void;
  onToggleChordLine: () => void;
}

export function LineToggleButtons({
  hideTextLine,
  hideChordLine,
  onToggleTextLine,
  onToggleChordLine,
}: LineToggleButtonsProps) {
  const buttonClass = (active: boolean) =>
    cn(
      'h-9 w-9 shrink-0 flex items-center justify-center rounded text-white',
      active
        ? 'bg-red-600 dark:bg-red-800 hover:bg-red-500 dark:hover:bg-red-700'
        : 'bg-green-600 dark:bg-green-800 hover:bg-green-500 dark:hover:bg-green-700'
    );

  return (
    <div className="flex items-center gap-2 h-9">
      <button
        type="button"
        title="Toggle Text Lines"
        className={buttonClass(hideTextLine)}
        onClick={onToggleTextLine}
      >
        <HideTextIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Toggle Chord Lines"
        className={buttonClass(hideChordLine)}
        onClick={onToggleChordLine}
      >
        <HideChordsIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
