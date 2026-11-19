import { useEffect, useState } from 'react';
import { loadFretboardDb, type FretboardDb } from '@/lib/chords/chordDiagrams';

/** The chord database for a guitar/ukulele (null while loading, or for piano). */
export function useFretboardDb(instrument: 'guitar' | 'ukulele' | 'piano'): FretboardDb | null {
  const [db, setDb] = useState<{ instrument: string; value: FretboardDb } | null>(null);
  useEffect(() => {
    if (instrument === 'piano') return;
    let cancelled = false;
    loadFretboardDb(instrument).then(value => {
      if (!cancelled) setDb({ instrument, value });
    });
    return () => {
      cancelled = true;
    };
  }, [instrument]);
  return db && db.instrument === instrument ? db.value : null;
}
