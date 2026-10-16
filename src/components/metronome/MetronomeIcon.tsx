interface MetronomeIconProps {
  /** Swings the needle while true; stays upright and still otherwise (e.g. the external/iframe engine, whose playback this app doesn't control). */
  playing: boolean;
  className?: string;
}

/** Metronome glyph with an animated needle, used in place of a generic timer icon. */
export function MetronomeIcon({ playing, className }: MetronomeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3L18 21H6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g
        style={{
          transformOrigin: '12px 21px',
          animation: playing ? 'metronome-swing 0.6s ease-in-out infinite' : 'none',
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
    </svg>
  );
}
