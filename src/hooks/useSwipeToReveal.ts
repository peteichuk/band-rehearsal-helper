import { useRef, useState, type TouchEvent } from 'react';
import { beginInteraction, endInteraction } from '@/lib/interactionLock';

const REVEAL_WIDTH_PX = 84;
const AXIS_LOCK_PX = 10;
const OPEN_THRESHOLD_PX = REVEAL_WIDTH_PX / 2;

/**
 * Telegram-style swipe-left-to-reveal: dragging the row left exposes a fixed
 * delete button behind it; releasing past the threshold snaps it fully open
 * (ignoring the rest of the drag), anything short of that snaps back closed.
 * A second, deliberate tap on the revealed button is what actually deletes —
 * this hook only manages the open/closed reveal state.
 */
export function useSwipeToReveal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const axisLocked = useRef<'horizontal' | 'vertical' | null>(null);
  const startedOpen = useRef(false);
  // Tracks whether *this* touch actually took the pull-to-refresh lock, so
  // onTouchEnd only ever releases a lock it took itself (never someone
  // else's, e.g. if the multi-touch guard below skipped it).
  const holdingLock = useRef(false);

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 1) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
    axisLocked.current = null;
    startedOpen.current = isOpen;
    holdingLock.current = true;
    beginInteraction();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    if (axisLocked.current === 'vertical') return;

    const x = event.touches[0]?.clientX ?? touchStartX.current;
    const y = event.touches[0]?.clientY ?? touchStartY.current;
    const dx = x - touchStartX.current;
    const dy = y - touchStartY.current;

    if (axisLocked.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (axisLocked.current === 'vertical') return;
    }

    const base = startedOpen.current ? -REVEAL_WIDTH_PX : 0;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH_PX, base + dx));
    setDragX(next);
  };

  const onTouchEnd = () => {
    const wasHorizontal = axisLocked.current === 'horizontal';
    axisLocked.current = null;
    touchStartX.current = null;
    touchStartY.current = null;
    if (holdingLock.current) {
      holdingLock.current = false;
      endInteraction();
    }

    if (!wasHorizontal) return;

    const shouldOpen = Math.abs(dragX) > OPEN_THRESHOLD_PX;
    setIsOpen(shouldOpen);
    setDragX(shouldOpen ? -REVEAL_WIDTH_PX : 0);
  };

  const close = () => {
    setIsOpen(false);
    setDragX(0);
  };

  return {
    isOpen,
    revealWidth: REVEAL_WIDTH_PX,
    style: {
      transform: `translateX(${isOpen ? -REVEAL_WIDTH_PX : dragX}px)`,
      transition: touchStartX.current == null ? 'transform 180ms ease-out' : 'none',
    },
    close,
    // touchcancel (browser takes over the gesture, e.g. a notification
    // swipe) reuses the same cleanup as a normal release — otherwise the
    // pull-to-refresh lock taken in onTouchStart would never get released.
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
  };
}
