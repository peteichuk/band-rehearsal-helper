import { useTranslation } from 'react-i18next';
import { ZoomControls } from '@/components/song-detail/ZoomControls';
import { TransposeControls } from '@/components/song-detail/TransposeControls';
import { CapoSelect } from '@/components/song-detail/CapoSelect';
import { ColumnSelect } from '@/components/song-detail/ColumnSelect';
import { ChordDiagramControls } from '@/components/song-detail/ChordDiagramControls';
import { LineToggleButtons } from '@/components/song-detail/LineToggleButtons';
import { CollapsiblePanel } from '@/components/shared/CollapsiblePanel';
import PrintIcon from '@/assets/icons/print.svg?react';
import type { TransposeOption } from '@/lib/chords/transpose';
import type { ChordDiagramSetting } from '@/lib/chords/chordDiagrams';

const DIVIDER = <div className="self-stretch w-px shrink-0 bg-gray-300 dark:bg-gray-600" />;

interface SongControlsPanelProps {
  open: boolean;
  fontSize: number;
  onFontSizeChange: (next: number) => void;
  resetFontSize: number;
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
  canPrint: boolean;
  chordInstrument: ChordDiagramSetting;
  onChordInstrumentChange: (value: ChordDiagramSetting) => void;
  showChordStrip: boolean;
  onToggleChordStrip: () => void;
  showChordInline: boolean;
  onToggleChordInline: () => void;
  chordDiagramScale: number;
  onChordDiagramScaleChange: (next: number) => void;
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
  resetFontSize,
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
  canPrint,
  chordInstrument,
  onChordInstrumentChange,
  showChordStrip,
  onToggleChordStrip,
  showChordInline,
  onToggleChordInline,
  chordDiagramScale,
  onChordDiagramScaleChange,
}: SongControlsPanelProps) {
  const { t } = useTranslation();
  return (
    <CollapsiblePanel open={open} className="print:hidden">
      <div className="flex flex-wrap items-center gap-3 mb-2 pt-1">
        <ZoomControls fontSize={fontSize} onChange={onFontSizeChange} resetValue={resetFontSize} />
        {DIVIDER}
        <ColumnSelect value={columnClass} onChange={onColumnClassChange} />
        {DIVIDER}
        <TransposeControls
          originalTonality={originalTonality}
          targetTonality={targetTonality}
          onTransposeChange={onTransposeChange}
        />
        <CapoSelect value={capo} onChange={onCapoChange} />
        {DIVIDER}
        <LineToggleButtons
          hideTextLine={hideTextLine}
          hideChordLine={hideChordLine}
          onToggleTextLine={onToggleTextLine}
          onToggleChordLine={onToggleChordLine}
        />
        {DIVIDER}
        <ChordDiagramControls
          instrument={chordInstrument}
          onInstrumentChange={onChordInstrumentChange}
          showStrip={showChordStrip}
          onToggleStrip={onToggleChordStrip}
          showInline={showChordInline}
          onToggleInline={onToggleChordInline}
          scale={chordDiagramScale}
          onScaleChange={onChordDiagramScaleChange}
        />
        {canPrint && (
          <>
            {DIVIDER}
            <button
              type="button"
              title={t('Print')}
              onClick={() => window.print()}
              className="p-2.5 shrink-0 flex items-center justify-center bg-white dark:bg-gray-700 hover:bg-muted dark:hover:bg-input/50 border border-gray-300 dark:border-gray-600 rounded"
            >
              <PrintIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </CollapsiblePanel>
  );
}
