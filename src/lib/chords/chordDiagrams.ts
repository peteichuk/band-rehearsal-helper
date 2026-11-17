import { get as getTonalChord } from '@tonaljs/chord';

/** Which diagram a chord is drawn as. 'off' disables tap-to-open and the bottom strip altogether. */
export type ChordInstrument = 'guitar' | 'ukulele' | 'piano';
export type ChordDiagramSetting = 'off' | ChordInstrument;

export const CHORD_INSTRUMENTS: ChordInstrument[] = ['guitar', 'ukulele', 'piano'];

/** One fingering from @tombatossals/chords-db — `frets` are relative to `baseFret` (0 open, -1 muted). */
export interface FretboardPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
}

interface FretboardDbChord {
  key: string;
  suffix: string;
  positions: FretboardPosition[];
}

export interface FretboardDb {
  main: { strings: number; fretsOnChord: number };
  keys: string[];
  chords: Record<string, FretboardDbChord[]>;
}

type FretboardInstrument = Exclude<ChordInstrument, 'piano'>;

// The chord databases are ~230 KB of JSON each — loaded on first use only,
// one dynamic chunk per instrument, never part of the main bundle.
const dbCache = new Map<FretboardInstrument, Promise<FretboardDb>>();

export function loadFretboardDb(instrument: FretboardInstrument): Promise<FretboardDb> {
  let promise = dbCache.get(instrument);
  if (!promise) {
    promise = (
      instrument === 'guitar'
        ? import('@tombatossals/chords-db/lib/guitar.json')
        : import('@tombatossals/chords-db/lib/ukulele.json')
    ).then(module => (module.default ?? module) as unknown as FretboardDb);
    dbCache.set(instrument, promise);
  }
  return promise;
}

const PITCH_CLASS_TO_CHROMA: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
  // German notation: H is what English calls B.
  H: 11,
};

/** Parses "F#", "Bb", "H" … to 0–11, or null. */
function chromaOf(note: string): number | null {
  const base = PITCH_CLASS_TO_CHROMA[note[0]];
  if (base === undefined) return null;
  let chroma = base;
  if (note[1] === '#') chroma += 1;
  else if (note[1] === 'b') chroma -= 1;
  return (chroma + 12) % 12;
}

export interface ParsedChord {
  rootChroma: number;
  /** Everything between the root and the slash, e.g. "m7", "sus4", "" (plain major). */
  quality: string;
  bassChroma: number | null;
}

/** Splits a (transposed) chord symbol into root, quality and optional slash bass. */
export function parseChordSymbol(symbol: string): ParsedChord | null {
  const [main, bass] = symbol.split('/');
  const rootMatch = /^[A-GH][#b]?/.exec(main);
  if (!rootMatch) return null;
  const rootChroma = chromaOf(rootMatch[0]);
  if (rootChroma === null) return null;
  const bassChroma = bass ? chromaOf(bass) : null;
  return { rootChroma, quality: main.slice(rootMatch[0].length), bassChroma };
}

// Alternate spellings in chord sheets → the suffix chords-db files them under.
const QUALITY_TO_SUFFIX: Record<string, string> = {
  '': 'major',
  maj: 'major',
  m: 'minor',
  sus: 'sus4',
  '2': 'sus2',
  '4': 'sus4',
};

// chords-db spells its slash chords with these bass names.
const BASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const CHROMA_TO_DB_KEYS: Record<number, string[]> = {
  0: ['C'],
  1: ['Csharp', 'Db'],
  2: ['D'],
  3: ['Eb'],
  4: ['E'],
  5: ['F'],
  6: ['Fsharp', 'Gb'],
  7: ['G'],
  8: ['Ab'],
  9: ['A'],
  10: ['Bb'],
  11: ['B'],
};

/** First fingering in the database for this chord, or null (unknown chord, or not in this instrument's DB). */
export function findFretboardPosition(db: FretboardDb, symbol: string): FretboardPosition | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  const dbKey = CHROMA_TO_DB_KEYS[parsed.rootChroma].find(key => key in db.chords);
  if (!dbKey) return null;
  const suffix = QUALITY_TO_SUFFIX[parsed.quality] ?? parsed.quality;
  const entries = db.chords[dbKey];
  const find = (wanted: string) => entries.find(entry => entry.suffix === wanted);

  // Slash chords only exist in the DB for plain major/minor — anything else
  // falls back to the chord without its bass note.
  if (parsed.bassChroma !== null && (suffix === 'major' || suffix === 'minor')) {
    const slash = `${suffix === 'minor' ? 'm' : ''}/${BASS_NAMES[parsed.bassChroma]}`;
    const slashEntry = find(slash);
    if (slashEntry) return slashEntry.positions[0] ?? null;
  }
  return find(suffix)?.positions[0] ?? null;
}

export interface PianoChord {
  /** Pitch classes (0–11) sounded by the chord. */
  chromas: number[];
  rootChroma: number;
}

/** Chord tones for a keyboard diagram (via tonal's chord dictionary), or null for an unknown chord. */
export function getPianoChord(symbol: string): PianoChord | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  // tonal has no German "H" — spell it as the B it is.
  const chord = getTonalChord(symbol.replace(/^H/, 'B').replace(/\/H/, '/B'));
  if (chord.empty) return null;
  const chromas = chord.notes.map(note => chromaOf(note)).filter((n): n is number => n !== null);
  if (chromas.length === 0) return null;
  return { chromas: [...new Set(chromas)], rootChroma: parsed.rootChroma };
}
