import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

interface HoldButtonProps {
  onComplete: () => void;
  /** How long the button has to be held, in ms. */
  holdMs?: number;
  /** Nothing to go to — rendered like any disabled button and ignores holds. */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  title?: string;
}

/**
 * A button that only fires once it has been held down for `holdMs` — the
 * button's own background fills up as a progress bar, and releasing early
 * (or sliding off it) cancels with nothing triggered. Used for Play mode's
 * prev/next, where a stray touch mid-song must never switch the song.
 *
 * On completion it plays a short "pop" (scale + flash) instead of a haptic
 * buzz. A keyboard activation (Enter/Space — a click with no pointer,
 * `detail === 0`) fires straight away, since "holding" isn't an option there.
 */
export function HoldButton({
  onComplete,
  holdMs = 300,
  disabled = false,
  className,
  children,
  title,
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  // How long the fill takes to drain back: quick on an early release, instant
  // (0) once the hold completed.
  const [drainMs, setDrainMs] = useState(150);
  const timerRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const pop = () => {
    buttonRef.current?.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.06)', filter: 'brightness(1.5)', offset: 0.35 },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: 280, easing: 'ease-out' }
    );
  };

  const start = () => {
    clearTimer();
    setDrainMs(150);
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      // Completed: snap the fill back instantly (no rewind animation).
      setDrainMs(0);
      setHolding(false);
      pop();
      // A long press can leave the browser with a text selection somewhere
      // (Android especially) — drop it, or it keeps hijacking later touches
      // on the song (selection handles instead of scrolling, ignored taps).
      window.getSelection()?.removeAllRanges();
      // One tick later, so the drain/pop get painted before the (heavy)
      // song switch re-render starts and stalls the main thread.
      window.setTimeout(() => onCompleteRef.current(), 50);
    }, holdMs);
  };

  const cancel = () => {
    clearTimer();
    setHolding(false);
  };

  useEffect(() => clearTimer, []);

  // A long press must never surface the browser's own gestures: the context
  // menu (Android/desktop), the text-selection callout (iOS) or a drag. React's
  // synthetic handlers aren't reliable for all of these (some fire after the
  // pointer was already cancelled), so they're blocked natively on the element.
  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;
    const block = (event: Event) => event.preventDefault();
    const events = ['contextmenu', 'selectstart', 'dragstart'] as const;
    events.forEach(name => element.addEventListener(name, block));
    return () => events.forEach(name => element.removeEventListener(name, block));
  }, []);

  return (
    <Button
      ref={buttonRef}
      type="button"
      title={title}
      disabled={disabled}
      draggable={false}
      onPointerDown={event => {
        // Only the primary button / a touch — not a right-click.
        if (event.button !== 0) return;
        event.preventDefault();
        start();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={event => {
        if (event.detail === 0) {
          pop();
          onCompleteRef.current();
        }
      }}
      className={cn(
        'relative h-auto touch-none overflow-hidden [-webkit-touch-callout:none] [-webkit-user-select:none] [-webkit-tap-highlight-color:transparent]',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/35"
        // A transform (not width) so it animates on the compositor and
        // keeps running smoothly even while the song switch renders. Fills
        // left→right over the hold, then rewinds back to the left (same
        // origin both ways, so it reads as progress going backwards — a
        // right-side origin looked like the fill just kept sweeping on).
        style={{
          transform: holding ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: holding ? `transform ${holdMs}ms linear` : `transform ${drainMs}ms ease-out`,
        }}
      />
      <span className="relative flex items-center justify-center gap-2 min-w-0">{children}</span>
    </Button>
  );
}
