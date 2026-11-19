import { useEffect, useState } from 'react';

/** Scroll speed per level, in CSS px per second — level 1 is a crawl for slow songs, level 3 (the default) a comfortable reading pace, the top level a brisk one. */
export const AUTO_SCROLL_SPEEDS = [3, 5, 8, 11, 14, 17, 21] as const;
export const AUTO_SCROLL_DEFAULT_LEVEL = 3;

/** After the user scrolls by hand, auto-scroll waits this long before carrying on from where they left it. */
const MANUAL_SCROLL_PAUSE_MS = 1500;

/**
 * Smoothly scrolls the page down at a configurable speed while `enabled`.
 * Reads as "the teleprompter for the lyrics": scrolling by hand (touch,
 * wheel, scrollbar, momentum) pauses it for a moment and it then carries on
 * from wherever you left the page — including after you scroll back up from
 * the bottom. It never switches itself off or blocks scrolling: at the end
 * of the page it simply idles, and only the toggle turns it off.
 *
 * Fractional positions are accumulated here rather than read back from
 * `scrollY` each frame — browsers round scroll offsets, so at slow speeds a
 * `scrollBy(0, 0.1)` per frame would otherwise never move at all.
 */
export function useAutoScroll(enabled: boolean, level: number) {
  useEffect(() => {
    if (!enabled) return;
    const speed = AUTO_SCROLL_SPEEDS[level - 1] ?? AUTO_SCROLL_SPEEDS[0];
    let frame = 0;
    let last = performance.now();
    let position = window.scrollY;
    let pausedUntil = 0;
    let touching = false;

    const pause = () => {
      pausedUntil = performance.now() + MANUAL_SCROLL_PAUSE_MS;
    };
    const onTouchStart = () => {
      touching = true;
      pause();
    };
    const onTouchEnd = () => {
      touching = false;
      pause();
    };
    const onWheel = () => pause();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      // The page moved by something other than us (scrollbar drag, momentum
      // after a flick, keyboard…) — treat it as manual scrolling too. Browsers
      // round scroll offsets, hence the tolerance.
      if (Math.abs(window.scrollY - position) > 2) {
        position = window.scrollY;
        pause();
      }
      if (touching || now < pausedUntil) {
        // Follow wherever the user scrolled to, so resuming doesn't snap back.
        position = window.scrollY;
      } else {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        position = Math.min(position + speed * dt, maxScroll);
        window.scrollTo(0, position);
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('wheel', onWheel);
    };
  }, [enabled, level]);
}

/** Owns the on/off + speed level state for auto-scroll (session-only — not persisted). */
export function useAutoScrollState() {
  const [enabled, setEnabled] = useState(false);
  const [level, setLevel] = useState(AUTO_SCROLL_DEFAULT_LEVEL);
  useAutoScroll(enabled, level);
  return {
    enabled,
    level,
    maxLevel: AUTO_SCROLL_SPEEDS.length,
    toggle: () => setEnabled(value => !value),
    stop: () => setEnabled(false),
    faster: () => setLevel(value => Math.min(value + 1, AUTO_SCROLL_SPEEDS.length)),
    slower: () => setLevel(value => Math.max(value - 1, 1)),
  };
}
