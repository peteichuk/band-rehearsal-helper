interface IconProps {
  className?: string;
}

/** A single chord box (frets + dots) — "show/hide a diagram next to each chord". */
export function ChordDiagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10M7 8.5h10M7 13h10M7 17.5h10M7 4v13.5M12 4v13.5M17 4v13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="7" cy="10.7" r="1.7" fill="currentColor" />
      <circle cx="12" cy="15.2" r="1.7" fill="currentColor" />
      <circle cx="17" cy="6.2" r="1.7" fill="currentColor" />
    </svg>
  );
}

/** A row of small chord boxes — "list every chord of the song below it". */
export function ChordStripIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M2.5 6h7M2.5 10h7M2.5 14h7M3.5 6v8M6 6v8M8.5 6v8" />
        <path d="M14.5 6h7M14.5 10h7M14.5 14h7M15.5 6v8M18 6v8M20.5 6v8" />
        <path d="M2.5 19.5h19" />
      </g>
      <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18" cy="8" r="1.2" fill="currentColor" />
      <circle cx="20.5" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}
