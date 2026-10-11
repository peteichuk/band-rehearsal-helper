import { Timer } from 'lucide-react';
import { ZoomControls } from '@/components/song-detail/ZoomControls';
import { TransposeControls } from '@/components/song-detail/TransposeControls';
import { CapoSelect } from '@/components/song-detail/CapoSelect';
import { ColumnSelect } from '@/components/song-detail/ColumnSelect';
import { LineToggleButtons } from '@/components/song-detail/LineToggleButtons';
import { CollapsiblePanel } from '@/components/shared/CollapsiblePanel';
import PrintIcon from '@/assets/icons/print.svg?react';
import type { TransposeOption } from '@/lib/chords/transpose';

const DIVIDER = <div className="h-9 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />;

interface SongControlsPanelProps {
  open: boolean;
  fontSize: number;
  onFontSizeChange: (next: number) => void;
  originalTonality: string;
  targetTonality: string | null;
  onTransposeChange: (option: TransposeOption) => void;
  capo: number;
  onCapoChange: (capo: number) => void;
  columnClass: string;
  onColumnClassChange: (value: string) => void;
  hideTextLine: boolean;
  hideChordLine: boolean;
  onToggleTextLine: () => void;
  onToggleChordLine: () => void;
  onOpenMetronome: () => void;
  canPrint: boolean;
}

/**
 * Collapses the display controls (zoom, key/capo, columns, line toggles) out
 * of the way by default — they're adjusted once per song, not every line, so
 * they don't deserve permanent space next to the lyrics.
 */
export function SongControlsPanel({
  open,
  fontSize,
  onFontSizeChange,
  originalTonality,
  targetTonality,
  onTransposeChange,
  capo,
  onCapoChange,
  columnClass,
  onColumnClassChange,
  hideTextLine,
  hideChordLine,
  onToggleTextLine,
  onToggleChordLine,
  onOpenMetronome,
  canPrint,
}: SongControlsPanelProps) {
  return (
    <CollapsiblePanel open={open} className="print:hidden">
      <div className="flex flex-wrap items-center gap-3 mb-2 pt-1">
        <ZoomControls fontSize={fontSize} onChange={onFontSizeChange} />
        {DIVIDER}
        <TransposeControls
          originalTonality={originalTonality}
          targetTonality={targetTonality}
          onTransposeChange={onTransposeChange}
        />
        <CapoSelect value={capo} onChange={onCapoChange} />
        {DIVIDER}
        <ColumnSelect value={columnClass} onChange={onColumnClassChange} />
        {DIVIDER}
        <LineToggleButtons
          hideTextLine={hideTextLine}
          hideChordLine={hideChordLine}
          onToggleTextLine={onToggleTextLine}
          onToggleChordLine={onToggleChordLine}
        />
        {DIVIDER}
        <button
          type="button"
          title="Metronome"
          onClick={onOpenMetronome}
          className="h-9 w-9 shrink-0 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white rounded"
        >
          <Timer className="w-4 h-4" />
        </button>
        {canPrint && (
          <button
            type="button"
            title="Print"
            onClick={() => window.print()}
            className="h-9 w-9 shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
          >
            <PrintIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </CollapsiblePanel>
  );
}
