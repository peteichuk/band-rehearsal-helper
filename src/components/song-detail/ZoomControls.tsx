import { ZoomIn, ZoomOut } from 'lucide-react';
import ReloadIcon from '@/assets/icons/reload.svg?react';

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 6;
const STEP = 2;

interface ZoomControlsProps {
  fontSize: number;
  onChange: (next: number) => void;
}

export function ZoomControls({ fontSize, onChange }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2 h-9">
      <button
        type="button"
        className="h-9 w-9 shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        onClick={() => onChange(Math.max(MIN_FONT_SIZE, fontSize - STEP))}
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Reset font size"
        className="h-9 px-3 shrink-0 flex items-center gap-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded font-semibold"
        onClick={() => onChange(DEFAULT_FONT_SIZE)}
      >
        <ReloadIcon className="w-4 h-4" />
        Aa
      </button>
      <button
        type="button"
        className="h-9 w-9 shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        onClick={() => onChange(fontSize + STEP)}
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
}

export { DEFAULT_FONT_SIZE };
