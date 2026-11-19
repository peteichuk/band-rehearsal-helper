import { useEffect, useRef } from 'react';
import { useMetronomeControl } from '@/lib/metronomeControl';

const SWING_DEG = 18;

interface MetronomeIconProps {
  /** Swings the needle while true; stays upright and still otherwise. */
  playing: boolean;
  /** Draws a diagonal slash through the glyph — "metronome off". */
  crossedOut?: boolean;
  className?: string;
}

/**
 * Metronome glyph whose needle swings in time with the real metronome: every
 * click is one swing, right on one beat and left on the next, so the needle
 * is at an extreme exactly when a tick sounds — like a physical metronome.
 *
 * Driven by the engine's beat (see metronomeControl.ts), not by a fixed CSS
 * loop, so it follows the actual BPM, time signature and any tempo change.
 * Until the first beat arrives (or if the engine isn't reachable), it falls
 * back to a free-running swing.
 */
export function MetronomeIcon({ playing, crossedOut = false, className }: MetronomeIconProps) {
  const control = useMetronomeControl();
  const needleRef = useRef<SVGGElement>(null);
  const animationRef = useRef<Animation | null>(null);
  // Which extreme the needle is at right now (+1 right, -1 left).
  const sideRef = useRef<1 | -1>(-1);
  // The last beat already animated — so a tempo edit (which only changes the
  // interval, not the beat) can't trigger an extra swing.
  const lastBeatRef = useRef<number | null>(null);

  const currentBeat = control?.currentBeat ?? null;
  const beatIntervalMs = control?.beatIntervalMs ?? null;
  const synced = playing && control !== null;

  useEffect(() => {
    if (!synced) {
      animationRef.current?.cancel();
      animationRef.current = null;
      sideRef.current = -1;
      lastBeatRef.current = null;
      return;
    }
    const needle = needleRef.current;
    if (!needle || currentBeat === null || beatIntervalMs === null) return;
    if (currentBeat === lastBeatRef.current) return;
    lastBeatRef.current = currentBeat;

    // This tick: the needle is at `from`; it travels to the opposite extreme,
    // arriving as the next tick sounds.
    const from = sideRef.current;
    const to = -from as 1 | -1;
    sideRef.current = to;
    animationRef.current?.cancel();
    animationRef.current = needle.animate(
      [
        { transform: `rotate(${from * SWING_DEG}deg)` },
        { transform: `rotate(${to * SWING_DEG}deg)` },
      ],
      // easeInOutSine: slows at the extremes, fastest through the middle.
      { duration: beatIntervalMs, easing: 'cubic-bezier(0.37, 0, 0.63, 1)', fill: 'forwards' }
    );
  }, [synced, currentBeat, beatIntervalMs]);

  useEffect(() => () => animationRef.current?.cancel(), []);

  // Free-running fallback: playing, but no beat info (yet).
  const fallbackSwing = playing && (!control || currentBeat === null);

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3L18 21H6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g
        ref={needleRef}
        style={{
          transformOrigin: '12px 21px',
          animation: fallbackSwing ? 'metronome-swing 0.6s ease-in-out infinite' : 'none',
        }}
      >
        <line
          x1="12"
          y1="21"
          x2="12"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14" r="1.6" fill="currentColor" />
      </g>
      <circle cx="12" cy="21" r="1.4" fill="currentColor" />
      {crossedOut && (
        <line
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
