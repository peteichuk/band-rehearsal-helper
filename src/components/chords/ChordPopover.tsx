import { createPortal } from 'react-dom';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { formatChordNotation, type ChordNotation } from '@/lib/chords/transpose';
import { ChordDiagram } from '@/components/chords/ChordDiagram';
import type { ChordInstrument } from '@/lib/chords/chordDiagrams';

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
          <div className="flex flex-col items-center gap-1">
            <strong className="text-base text-blue-600 dark:text-blue-400">
              {formatChordNotation(open.chord, chordNotation)}
            </strong>
            <ChordDiagram
              chord={open.chord}
              instrument={instrument}
              width={Math.max(MIN_WIDTH, fontSize * WIDTH_PER_FONT_PX) * scale}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
