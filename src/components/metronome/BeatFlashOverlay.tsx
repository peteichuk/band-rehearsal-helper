import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBeatFlash } from '@/components/metronome/useBeatFlash';
import type { FlashIntensity } from '@/lib/appPreferences';
import type { BeatLevel } from '@/components/metronome/timeSignatures';

interface BeatFlashOverlayProps {
  enabled: boolean;
  currentBeat: number | null;
  /** One entry per beat — decides how strong each flash is. */
  accentPattern: BeatLevel[];
  intensity: FlashIntensity;
}

/**
 * Per intensity: how bright the strongest beat gets (`peak`, a multiplier on
 * the per-beat-level opacities) and the glow's size. Within one intensity the
 * size never changes — only the opacity varies with the beat's strength.
 */
const INTENSITY_STYLE: Record<FlashIntensity, { peak: number; shadow: string }> = {
  low: { peak: 1, shadow: 'inset 0 0 20px 2px currentColor' },
  normal: { peak: 1, shadow: 'inset 0 0 36px 6px currentColor' },
  // Built for Play mode / a stage: visible from across the room.
  high: { peak: 1, shadow: 'inset 0 0 64px 14px currentColor' },
};

/**
 * Screen-edge "frame" glow (an inset shadow, centre stays clear) in time with
 * the beat. Rendered into document.body (not inside the metronome modal) so
 * it covers the whole screen — including the song page behind the modal,
 * since the metronome keeps running while the modal is closed.
 */
export function BeatFlashOverlay({
  enabled,
  currentBeat,
  accentPattern,
  intensity,
}: BeatFlashOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { peak, shadow } = INTENSITY_STYLE[intensity];
  useBeatFlash(overlayRef, enabled, currentBeat, accentPattern, peak);

  if (!enabled) return null;
  return createPortal(
    <div
      ref={overlayRef}
      aria-hidden="true"
      style={{ boxShadow: shadow }}
      className="pointer-events-none fixed inset-0 z-[200] text-orange-600 opacity-0"
    />,
    document.body
  );
}
