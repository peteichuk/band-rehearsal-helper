import { useRef, type TouchEvent } from 'react';

const MIN_SWIPE_DISTANCE_PX = 60;
const AXIS_LOCK_PX = 10;
const RESISTANCE = 0.3;
const SLIDE_TRANSITION = 'transform 180ms ease-out, opacity 180ms ease-out';

interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Whether there's a next/prev song to navigate to — drives rubber-band resistance. */
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * Horizontal swipe detector with a card-style drag/slide visual: the content
 * follows the finger while dragging, slides fully off-screen on a committed
 * swipe, then slides in from the other side once the new song is in place.
 * Mutates the attached element's style directly (not via React state) so the
 * drag stays smooth regardless of how heavy the song content is to render.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  hasNext = true,
  hasPrev = true,
}: UseSwipeNavigationOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const axisLocked = useRef<'horizontal' | 'vertical' | null>(null);

  const applyStyle = (x: number, opacity: number, withTransition: boolean) => {
    const el = elementRef.current;
    if (!el) return;
    el.style.transition = withTransition ? SLIDE_TRANSITION : 'none';
    el.style.transform = x === 0 ? '' : `translateX(${x}px)`;
    el.style.opacity = opacity === 1 ? '' : String(opacity);
  };

  const slideOutThenIn = (direction: 'left' | 'right', navigate: () => void) => {
    const el = elementRef.current;
    const width = el?.offsetWidth || window.innerWidth;
    const exitX = direction === 'left' ? -width : width;
    applyStyle(exitX, 0, true);

    window.setTimeout(() => {
      navigate();
      // Jump to the entry position (new song content is already in place),
      // then let it slide in on the next frame once it's painted.
      applyStyle(-exitX, 0, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => applyStyle(0, 1, true));
      });
    }, 180);
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
    axisLocked.current = null;
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

    const movingToNext = dx < 0;
    const canMove = movingToNext ? hasNext : hasPrev;
    const dragX = canMove ? dx : dx * RESISTANCE;
    const opacity = Math.max(1 - Math.abs(dragX) / 500, 0.7);
    applyStyle(dragX, opacity, false);
  };

  const onTouchEnd = (event: TouchEvent) => {
    const wasHorizontal = axisLocked.current === 'horizontal';
    axisLocked.current = null;

    if (touchStartX.current == null || !wasHorizontal) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchEndX - touchStartX.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(delta) < MIN_SWIPE_DISTANCE_PX) {
      applyStyle(0, 1, true);
      return;
    }

    if (delta < 0 && hasNext && onSwipeLeft) {
      slideOutThenIn('left', onSwipeLeft);
      return;
    }

    if (delta > 0 && hasPrev && onSwipeRight) {
      slideOutThenIn('right', onSwipeRight);
      return;
    }

    applyStyle(0, 1, true);
  };

  return { ref: elementRef, onTouchStart, onTouchMove, onTouchEnd };
}
