import { cn } from '@/lib/utils';

export const BUTTON_CLASS =
  'text-sm py-2.5 px-4 flex items-center justify-center gap-2 rounded font-medium transition-colors shrink-0';
export const PRIMARY_BUTTON_CLASS = cn(
  BUTTON_CLASS,
  'bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white'
);
export const METRONOME_BUTTON_CLASS = cn(
  BUTTON_CLASS,
  'bg-orange-600 hover:bg-orange-700 text-white'
);
