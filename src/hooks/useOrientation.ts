import { useEffect, useState } from 'react';
import type { Orientation } from '@/lib/songDisplayConfig';

function getCurrentOrientation(): Orientation {
  return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
}

/** Tracks portrait/landscape live, same matchMedia pattern as useDarkMode. */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(getCurrentOrientation);

  useEffect(() => {
    const media = window.matchMedia('(orientation: portrait)');
    const onChange = (event: MediaQueryListEvent) =>
      setOrientation(event.matches ? 'portrait' : 'landscape');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return orientation;
}
