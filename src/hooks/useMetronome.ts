import { useEffect, useState } from 'react';

/**
 * Owns the metronome modal's open/closed state and whether it's ever been
 * opened (so callers know whether to show a launcher button). `resetKey`
 * identifies the current song (e.g. a route path) — the caller still keys
 * its panel on it directly to refresh BPM/time signature per song.
 *
 * Closing on navigation only fires when leaving the song-detail section
 * entirely (e.g. back to the catalog) — flipping between songs via
 * prev/next/swipe changes `resetKey` too, but should leave the metronome
 * open and just let it pick up the new song's values, not dismiss it.
 */
export function useMetronome(resetKey: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const section = resetKey.startsWith('/song/') ? '/song' : resetKey;

  useEffect(() => {
    setIsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const open = () => {
    setIsOpen(true);
    setHasOpenedOnce(true);
  };
  const close = () => setIsOpen(false);

  return { isOpen, open, close, hasOpenedOnce };
}
