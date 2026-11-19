import { useEffect, useRef } from 'react';

/**
 * A song-title popup, centred horizontally near the top of the screen, that flashes for a moment
 * whenever the song changes in Play mode — a visual confirmation that the
 * hold-to-switch actually went through (stand-in for a haptic buzz). Skips
 * the very first render, so entering Play mode doesn't announce the song
 * you're already looking at.
 *
 * The outer layer does the centring and the side gutters (so the pill can
 * never touch or leave the screen edges); the pill itself only shrinks to
 * its text, wraps onto a second line, and truncates from the third.
 */
export function PlayModeSongBanner({ songName }: { songName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const previousRef = useRef(songName);

  useEffect(() => {
    if (previousRef.current === songName) return;
    previousRef.current = songName;
    ref.current?.animate(
      [
        { opacity: 0, transform: 'scale(0.92)' },
        { opacity: 1, transform: 'scale(1)', offset: 0.15 },
        { opacity: 1, transform: 'scale(1)', offset: 0.7 },
        { opacity: 0, transform: 'scale(0.97)' },
      ],
      { duration: 1400, easing: 'ease-out' }
    );
  }, [songName]);

  return (
    <div
      aria-hidden="true"
      className="print:hidden pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-6"
    >
      <div
        ref={ref}
        className="max-w-full rounded-2xl bg-blue-700 px-6 py-4 text-center text-xl font-semibold leading-snug text-white opacity-0 shadow-xl dark:bg-blue-600"
      >
        <span className="line-clamp-2 break-words">{songName}</span>
      </div>
    </div>
  );
}
