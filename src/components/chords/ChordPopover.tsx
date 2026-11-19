import { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChordSongContext, useChordPosition } from '@/hooks/useChordPositions';
import { useFretboardDb } from '@/hooks/useFretboardDb';
import {
  activeChordPositionScope,
  getChordPositionsSnapshot,
  getScopedChordPosition,
  resetChordPosition,
  setChordPosition,
  type ChordPositionScope,
} from '@/lib/chordPositions';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { formatChordNotation, type ChordNotation } from '@/lib/chords/transpose';
import { ChordDiagram } from '@/components/chords/ChordDiagram';
import { findFretboardPositions, type ChordInstrument } from '@/lib/chords/chordDiagrams';

export interface OpenChord {
  chord: string;
  anchor: HTMLElement;
}

interface ChordPopoverProps {
  open: OpenChord | null;
  onClose: () => void;
  instrument: ChordInstrument;
  /** The song text's font size in px — the diagram scales in proportion to it. */
  fontSize: number;
  /** Multiplier from the diagram size +/- control (1 = default). */
  scale: number;
  chordNotation: ChordNotation;
}

/** Diagram width per px of song font size (so 16px text → 96px diagram). */
const WIDTH_PER_FONT_PX = 6;
const MIN_WIDTH = 60;

/** One shared popover for the whole song, anchored to whichever chord was tapped last. */
export function ChordPopover({
  open,
  onClose,
  instrument,
  fontSize,
  scale,
  chordNotation,
}: ChordPopoverProps) {
  return (
    <Popover open={open !== null} onOpenChange={next => !next && onClose()}>
      {open && <PopoverAnchor virtualRef={{ current: open.anchor }} />}
      {/* Invisible full-screen catcher: tapping anywhere while the popover is
          open just closes it, instead of also hitting whatever is underneath
          (another chord, a line's note editor, a button …). It stays mounted
          until its own click lands — Radix's own outside-pointer dismissal is
          switched off below, because that fires on pointerdown, unmounts this
          layer, and lets the click that follows reach the page behind it. */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-40"
            onClick={event => {
              event.stopPropagation();
              onClose();
            }}
            // Portal children still bubble through the React tree, which
            // includes the song's swipe-to-navigate touch handlers.
            onTouchStart={event => event.stopPropagation()}
            onTouchMove={event => event.stopPropagation()}
            onTouchEnd={event => event.stopPropagation()}
            aria-hidden="true"
          />,
          document.body
        )}
      <PopoverContent
        className="w-auto"
        onOpenAutoFocus={event => event.preventDefault()}
        onPointerDownOutside={event => event.preventDefault()}
        onInteractOutside={event => event.preventDefault()}
      >
        {open && (
          <ChordPopoverBody
            key={`${instrument}|${open.chord}`}
            chord={open.chord}
            instrument={instrument}
            width={Math.max(MIN_WIDTH, fontSize * WIDTH_PER_FONT_PX) * scale}
            chordNotation={chordNotation}
            onClose={onClose}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function ChordPopoverBody({
  chord,
  instrument,
  width,
  chordNotation,
  onClose,
}: {
  chord: string;
  instrument: ChordInstrument;
  width: number;
  chordNotation: ChordNotation;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const songName = useContext(ChordSongContext);
  const saved = useChordPosition(instrument, chord);
  const db = useFretboardDb(instrument);
  const total = db ? findFretboardPositions(db, chord).length : 0;
  const [draft, setDraft] = useState<number | null>(null);
  const [scope, setScope] = useState<ChordPositionScope>(() =>
    activeChordPositionScope(getChordPositionsSnapshot(), songName, instrument, chord)
  );
  // Re-read on every render: `saved` subscribes to the store, so this stays fresh.
  const scopeHasOverride =
    getScopedChordPosition(getChordPositionsSnapshot(), scope, songName, instrument, chord) !==
    undefined;

  const current = Math.min(draft ?? saved.index, Math.max(total - 1, 0));
  const canEdit = instrument !== 'piano' && total > 1;
  const step = (delta: number) => setDraft((current + delta + total) % total);

  return (
    <div className="flex flex-col items-center gap-1">
      <strong className="text-base text-blue-600 dark:text-blue-400">
        {formatChordNotation(chord, chordNotation)}
      </strong>
      <ChordDiagram chord={chord} instrument={instrument} width={width} positionIndex={current} />
      {canEdit && (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('Previous position')}
              onClick={() => step(-1)}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-12 text-center text-sm tabular-nums">
              {current + 1} / {total}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('Next position')}
              onClick={() => step(1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="flex w-full items-center gap-2">
            <Select value={scope} onValueChange={value => setScope(value as ChordPositionScope)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">{t('All songs')}</SelectItem>
                {songName && <SelectItem value="song">{t('This song')}</SelectItem>}
                {songName && (
                  <SelectItem value="temporary">{t('This song, temporarily')}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!scopeHasOverride}
              onClick={() => {
                resetChordPosition(scope, songName, instrument, chord);
                onClose();
              }}
              title={t('Reset')}
            >
              <RotateCcw className="size-5" />
              <span className="sr-only">{t('Reset')}</span>
            </Button>
            <Button
              type="button"
              size="icon"
              disabled={draft === null}
              onClick={() => {
                setChordPosition(scope, songName, instrument, chord, current);
                onClose();
              }}
              title={t('Save')}
            >
              <Save className="size-5" />
              <span className="sr-only">{t('Save')}</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
