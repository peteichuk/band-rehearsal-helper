import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';

/**
 * Owns all metronome state: open/closed, whether it's ever been opened (so
 * callers know whether to show a launcher button), and the iframe `src` for
 * the currently running song. `resetKey` identifies the current song (e.g. a
 * route path) — changing it stops the metronome, so the next open starts
 * fresh with that song's `bpm` (or 120 if none).
 */
export function useMetronome(resetKey: string, bpm: number | null) {
  const isDark = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setSrc(null);
  }, [resetKey]);

  useEffect(() => {
    if (!isOpen || src !== null) return;
    const tempo = bpm || 120;
    const theme = isDark ? 'dark' : 'light';
    setSrc(
      `https://guitarapp.com/metronome.html?tempo=${tempo}&timeSignature=2&pattern=0&theme=${theme}&embed=true`
    );
  }, [isOpen, src, bpm, isDark]);

  const open = () => {
    setIsOpen(true);
    setHasOpenedOnce(true);
  };
  const close = () => setIsOpen(false);

  return { isOpen, open, close, hasOpenedOnce, src };
}
