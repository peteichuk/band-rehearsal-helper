import { useEffect, useRef, useState } from 'react';
import { isInteractionActive } from '@/lib/interactionLock';

const THRESHOLD_PX = 64;
const MAX_PULL_PX = 96;
const RESISTANCE = 0.5;
// How far into the content, from the container's own top edge, a pull can
// start — generous on purpose: being at the top of the scroll is already
// the main guard against hijacking normal scrolling/taps, so this just
// needs to make "swipe down near the top of the screen" feel like an
// obvious, intuitive refresh gesture.
const START_ZONE_PX = 100;

interface UsePullToRefreshOptions {
  onRefresh: () => unknown | Promise<unknown>;
  disabled?: boolean;
}

/**
 * Pull-to-refresh for the app's own scroll container — installed as a PWA,
 * the browser's native pull-to-refresh (standalone display mode) isn't
 * available, so this is the only way to get the gesture at all.
 *
 * Needs a real (non-passive) `touchmove` listener to preventDefault the
 * native overscroll bounce while dragging — React's synthetic touch props
 * are passive by default and can't do that, hence manual addEventListener
 * here instead of onTouchMove/onTouchStart JSX props.
 */
export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  disabled = false,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<T | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pulling = useRef(false);
  // Mirrors the pullDistance/isRefreshing state for the touch handlers to
  // read synchronously. Needed because the state setter's updater-function
  // form runs twice under StrictMode (React double-invokes it on purpose,
  // to catch impure updaters) — doing the refresh side effect in there, as
  // an earlier version of this hook did, fired onRefresh twice per pull.
  const currentDistance = useRef(0);
  const isRefreshingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    // `el` (the <main> scroll container) only actually scrolls once its
    // content overflows ITS OWN box — with the layout's current min-h-screen
    // wrapper, that box instead just grows past the viewport and it's
    // document/body that scrolls, leaving el.scrollTop permanently 0. Check
    // both, so "at the top" is right regardless of which one is the real
    // scroller; otherwise any downward drag anywhere hijacks as a pull.
    const isAtTop = () => el.scrollTop <= 0 && (document.scrollingElement?.scrollTop ?? 0) <= 0;

    const onTouchStart = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? null;
      const withinStartZone = y != null && y - el.getBoundingClientRect().top <= START_ZONE_PX;
      // isInteractionActive() is a plain synchronous read of a module-level
      // counter — unlike the `disabled` prop, it needs no re-render/effect
      // cycle to take effect. That matters here: this listener detaches via
      // a *passive* useEffect below, which runs after paint, so there's a
      // real window where a drag/swipe has already started (its own handler
      // already called beginInteraction()) but this old listener is still
      // attached and would otherwise still capture the touch as a pull.
      if (isRefreshingRef.current || isInteractionActive() || !isAtTop() || !withinStartZone) {
        touchStartY.current = null;
        return;
      }
      touchStartY.current = y;
      pulling.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY.current == null) return;
      const dy = (event.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;

      if (dy <= 0 || !isAtTop() || isInteractionActive()) {
        pulling.current = false;
        currentDistance.current = 0;
        setIsDragging(false);
        setPullDistance(0);
        return;
      }

      pulling.current = true;
      setIsDragging(true);
      // Replaces the native overscroll bounce with our own indicator while
      // dragging — only once we've committed to this being a pull (dy > 0
      // at the top), so an ordinary scroll-down is never blocked.
      event.preventDefault();
      const distance = Math.min(dy * RESISTANCE, MAX_PULL_PX);
      currentDistance.current = distance;
      setPullDistance(distance);
    };

    const onTouchEnd = () => {
      touchStartY.current = null;
      setIsDragging(false);
      if (!pulling.current) return;
      pulling.current = false;

      if (currentDistance.current < THRESHOLD_PX) {
        setPullDistance(0);
        return;
      }

      setPullDistance(THRESHOLD_PX); // holds the indicator in place while refreshing
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      Promise.resolve()
        .then(onRefresh)
        .finally(() => {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          setPullDistance(0);
        });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled, onRefresh]);

  return { containerRef, pullDistance, isDragging, isRefreshing, threshold: THRESHOLD_PX };
}
