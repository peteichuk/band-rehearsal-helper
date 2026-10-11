import { useEffect, useState } from 'react';

/**
 * Owns the metronome modal's open/closed state and whether it's ever been
 * opened (so callers know whether to show a launcher button). `resetKey`
 * identifies the current song (e.g. a route path) — changing it closes the
 * metronome, so navigating away stops it.
 */
export function useMetronome(resetKey: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [resetKey]);

  const open = () => {
    setIsOpen(true);
    setHasOpenedOnce(true);
  };
  const close = () => setIsOpen(false);

  return { isOpen, open, close, hasOpenedOnce };
}
