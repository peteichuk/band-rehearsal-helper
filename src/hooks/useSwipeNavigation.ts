import { useRef, type TouchEvent } from 'react';

const MIN_SWIPE_DISTANCE_PX = 60;
const EDGE_ZONE_PX = 24;

interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /**
   * Swipe starting within EDGE_ZONE_PX of the left screen edge, moving
   * right — mimics the native iOS "edge swipe to go back" gesture. Takes
   * priority over onSwipeRight for that specific starting position.
   */
  onEdgeSwipeBack?: () => void;
}

/**
 * Lightweight horizontal swipe detector (no sliding animation — this is a
 * chord sheet reader, not a slideshow, so a swipe just triggers an instant
 * prev/next navigation, same as the on-screen buttons).
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onEdgeSwipeBack,
}: UseSwipeNavigationOptions) {
  const touchStartX = useRef<number | null>(null);
  const startedAtEdge = useRef(false);

  const onTouchStart = (event: TouchEvent) => {
    const x = event.touches[0]?.clientX ?? null;
    touchStartX.current = x;
    startedAtEdge.current = x != null && x <= EDGE_ZONE_PX;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current == null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchEndX - touchStartX.current;
    const wasEdgeStart = startedAtEdge.current;
    touchStartX.current = null;
    startedAtEdge.current = false;

    if (Math.abs(delta) < MIN_SWIPE_DISTANCE_PX) return;

    if (delta > 0 && wasEdgeStart && onEdgeSwipeBack) {
      onEdgeSwipeBack();
      return;
    }

    if (delta < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  return { onTouchStart, onTouchEnd };
}
