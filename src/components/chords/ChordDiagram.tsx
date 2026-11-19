import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  findFretboardPosition,
  getPianoChord,
  loadFretboardDb,
  type ChordInstrument,
  type FretboardDb,
} from '@/lib/chords/chordDiagrams';
import { useChordPosition } from '@/hooks/useChordPositions';
import { FretboardDiagram } from '@/components/chords/FretboardDiagram';
import { PianoDiagram } from '@/components/chords/PianoDiagram';

interface ChordDiagramProps {
  /** The chord as displayed (already transposed). */
  chord: string;
  instrument: ChordInstrument;
  /** Width in px of a guitar/ukulele diagram — the piano is drawn proportionally wider. */
  width: number;
  /** Forces a specific fingering (the popover's preview) instead of the saved choice. */
  positionIndex?: number;
}

// A keyboard needs more horizontal room than a 4–6 string chord box to stay readable.
const PIANO_WIDTH_FACTOR = 1.8;

export function ChordDiagram({ chord, instrument, width, positionIndex }: ChordDiagramProps) {
  const { t } = useTranslation();
  const saved = useChordPosition(instrument, chord);
  const [db, setDb] = useState<FretboardDb | null>(null);

  useEffect(() => {
    if (instrument === 'piano') return;
    let cancelled = false;
    loadFretboardDb(instrument).then(loaded => {
      if (!cancelled) setDb(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  if (instrument === 'piano') {
    const pianoChord = getPianoChord(chord);
    return pianoChord ? (
      <PianoDiagram chord={pianoChord} width={width * PIANO_WIDTH_FACTOR} />
    ) : (
      <NoDiagram text={t('No diagram for this chord')} />
    );
  }

  // `db` can briefly belong to the previously-selected instrument — its
  // string count tells the two apart, so wait for the matching one.
  const expectedStrings = instrument === 'guitar' ? 6 : 4;
  if (!db || db.main.strings !== expectedStrings) {
    return <div style={{ width, height: width * 1.1 }} aria-hidden="true" />;
  }
  const position = findFretboardPosition(db, chord, positionIndex ?? saved.index);
  return position ? (
    <FretboardDiagram
      position={position}
      strings={db.main.strings}
      frets={db.main.fretsOnChord}
      width={width}
    />
  ) : (
    <NoDiagram text={t('No diagram for this chord')} />
  );
}

function NoDiagram({ text }: { text: string }) {
  return <span className="text-xs text-muted-foreground">{text}</span>;
}
