import { useTranslation } from 'react-i18next';
import { EyeOff, Guitar, Piano, type LucideIcon } from 'lucide-react';
import { ChordDiagramIcon, ChordStripIcon } from '@/components/chords/ChordIcons';
import { ZoomControls } from '@/components/song-detail/ZoomControls';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChordDiagramSetting } from '@/lib/chords/chordDiagrams';

// Each option carries its own icon — the dropdown lists them all at once, so
// an icon derived from the current value would repaint every row the same.
const OPTIONS: { value: ChordDiagramSetting; label: string; icon: LucideIcon }[] = [
  { value: 'off', label: 'Chord diagrams: off', icon: EyeOff },
  { value: 'guitar', label: 'Guitar', icon: Guitar },
  { value: 'ukulele', label: 'Ukulele', icon: Guitar },
  { value: 'piano', label: 'Piano', icon: Piano },
];

interface ChordInstrumentSelectProps {
  value: ChordDiagramSetting;
  onChange: (value: ChordDiagramSetting) => void;
}

export function ChordInstrumentSelect({ value, onChange }: ChordInstrumentSelectProps) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={next => onChange(next as ChordDiagramSetting)}>
      <SelectTrigger
        title={t('Chord diagrams')}
        className="w-auto gap-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map(({ value: optionValue, label, icon: Icon }) => (
          <SelectItem key={optionValue} value={optionValue}>
            <span className="flex items-center gap-2">
              <Icon className="size-5" />
              {t(label)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ChordDiagramControlsProps {
  instrument: ChordDiagramSetting;
  onInstrumentChange: (value: ChordDiagramSetting) => void;
  showStrip: boolean;
  onToggleStrip: () => void;
  showInline: boolean;
  onToggleInline: () => void;
  /** Diagram size in percent of the default. */
  scale: number;
  onScaleChange: (next: number) => void;
}

const SCALE_STEP = 10;
const MIN_SCALE = 40;
const DEFAULT_SCALE = 100;

function ToggleButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'p-2.5 shrink-0 flex items-center justify-center rounded border',
        active
          ? 'bg-blue-700 dark:bg-blue-600 text-white border-transparent hover:bg-blue-800 dark:hover:bg-blue-700'
          : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-input/50'
      )}
    >
      {children}
    </button>
  );
}

/**
 * Picks the instrument chords are drawn for (or switches diagrams off
 * entirely). Once on: toggles for the strip below the song and for a
 * diagram beside every chord, and +/- for the size of all of them.
 */
export function ChordDiagramControls({
  instrument,
  onInstrumentChange,
  showStrip,
  onToggleStrip,
  showInline,
  onToggleInline,
  scale,
  onScaleChange,
}: ChordDiagramControlsProps) {
  const { t } = useTranslation();
  const off = instrument === 'off';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChordInstrumentSelect value={instrument} onChange={onInstrumentChange} />
      {!off && (
        <>
          <ToggleButton
            active={showInline}
            title={t('Always show a diagram next to each chord')}
            onClick={onToggleInline}
          >
            <ChordDiagramIcon className="w-5 h-5" />
          </ToggleButton>
          <ToggleButton
            active={showStrip}
            title={t('Show all chords below the song')}
            onClick={onToggleStrip}
          >
            <ChordStripIcon className="w-5 h-5" />
          </ToggleButton>
          <ZoomControls
            fontSize={scale}
            onChange={onScaleChange}
            resetValue={DEFAULT_SCALE}
            step={SCALE_STEP}
            min={MIN_SCALE}
            label={`${scale}%`}
            resetTitle={t('Reset diagram size')}
          />
        </>
      )}
    </div>
  );
}
