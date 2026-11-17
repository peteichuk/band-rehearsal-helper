import { useEffect, useRef, type RefObject } from 'react';
import type { BeatLevel } from '@/components/metronome/timeSignatures';

/**
 * Peak opacity of a beat flash per beat level: the stronger the beat, the
 * brighter it is. Kept below full strength on purpose — a harsh flash is
 * tiring (and a photosensitivity risk).
 */
const FLASH_OPACITY: Record<BeatLevel, number> = {
  mute: 0,
  normal: 0.4,
  medium: 0.7,
  accent: 1,
};

const FLASH_DURATION_MS = 160;

/**
 * Fades `ref`'s element from a level-dependent opacity down to 0 on every
 * beat change (the element itself should rest at opacity 0). `peakScale`
 * tones the whole range down for elements that cover content.
 */
export function useBeatFlash(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  currentBeat: number | null,
  accentPattern: BeatLevel[],
  peakScale = 1
) {
  // Read through a ref so a mid-bar accent-pattern edit never re-triggers a
  // flash by itself — only an actual beat change does.
  const accentPatternRef = useRef(accentPattern);
  accentPatternRef.current = accentPattern;

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || currentBeat === null) return;
    const opacity = FLASH_OPACITY[accentPatternRef.current[currentBeat] ?? 'normal'] * peakScale;
    if (opacity === 0) return;
    element.animate([{ opacity }, { opacity: 0 }], {
      duration: FLASH_DURATION_MS,
      easing: 'ease-out',
    });
  }, [ref, enabled, currentBeat, peakScale]);
}
