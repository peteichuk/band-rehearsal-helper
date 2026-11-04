import { ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReloadIcon from '@/assets/icons/reload.svg?react';

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 6;
const STEP = 2;

interface ZoomControlsProps {
  fontSize: number;
  onChange: (next: number) => void;
  /** What "reset" goes back to — defaults to the hardcoded base size. */
  resetValue?: number;
}

export function ZoomControls({
  fontSize,
  onChange,
  resetValue = DEFAULT_FONT_SIZE,
}: ZoomControlsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="p-2.5 shrink-0 flex items-center justify-center bg-white dark:bg-gray-700 hover:bg-muted dark:hover:bg-input/50 border border-gray-300 dark:border-gray-600 rounded"
        onClick={() => onChange(Math.max(MIN_FONT_SIZE, fontSize - STEP))}
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button
        type="button"
        title={t('Reset font size')}
        className="py-2.5 px-4 shrink-0 flex items-center gap-1.5 bg-white dark:bg-gray-700 hover:bg-muted dark:hover:bg-input/50 border border-gray-300 dark:border-gray-600 rounded text-sm font-semibold"
        onClick={() => onChange(resetValue)}
      >
        <ReloadIcon className="w-5 h-5" />
        Aa {fontSize}
      </button>
      <button
        type="button"
        className="p-2.5 shrink-0 flex items-center justify-center bg-white dark:bg-gray-700 hover:bg-muted dark:hover:bg-input/50 border border-gray-300 dark:border-gray-600 rounded"
        onClick={() => onChange(fontSize + STEP)}
      >
        <ZoomIn className="w-5 h-5" />
      </button>
    </div>
  );
}

export { DEFAULT_FONT_SIZE };
