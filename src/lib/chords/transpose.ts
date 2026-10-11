export const CHORDS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NORMALIZE_MAP: Record<string, string> = {
  Cb: 'B',
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  'E#': 'F',
  'B#': 'C',
  H: 'B', // Support H as B
};

export const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

export function transposeChord(chord: string, steps: number, useFlats = false): string {
  if (!chord) return chord;

  // Slash chords: transpose each part separately, keeping the same sharp/flat choice.
  if (chord.includes('/')) {
    return chord
      .split('/')
      .map(part => transposeChord(part, steps, useFlats))
      .join('/');
  }

  const match = chord.match(/^([A-H][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, suffix] = match;

  // Normalize flats to sharps for lookup.
  const normalizedRoot = NORMALIZE_MAP[root] || root;

  const index = CHORDS.indexOf(normalizedRoot);
  if (index === -1) return chord;

  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  let transposedRoot = CHORDS[newIndex];

  if (useFlats && SHARP_TO_FLAT[transposedRoot]) {
    transposedRoot = SHARP_TO_FLAT[transposedRoot];
  }

  return transposedRoot + suffix;
}

export const DISPLAY_SCALE = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
  'H',
];

const FLAT_NOTES = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db']);

export interface TransposeOption {
  /** Display label, e.g. "D#" or "C (Original)" */
  label: string;
  /** Tonality name without the "(Original)" suffix, e.g. "D#" */
  tonalityName: string;
  steps: number;
  useFlats: boolean;
  isOriginal: boolean;
}

/** Wraps a step offset into 0..11 — the only range a capo fret count can be. */
export function wrapCapoSteps(steps: number): number {
  return ((steps % 12) + 12) % 12;
}

/**
 * Finds the tonality option that's `steps` semitones above the original key
 * (wrapping into a single octave), so a capo fret count can drive the same
 * tonality dropdown that a key name does.
 */
export function getTransposeOptionForSteps(
  originalTonality: string,
  steps: number
): TransposeOption {
  const options = getTransposeOptions(originalTonality);
  const wrapped = wrapCapoSteps(steps);
  const candidates = options.filter(option => wrapCapoSteps(option.steps) === wrapped);
  // A 0-semitone offset ("No Capo") always has two enharmonic candidates
  // when the song's own key is flat-spelled (e.g. Eb has both D# and Eb in
  // the list) — prefer whichever one is flagged as the song's true original
  // spelling, or isOriginal never matches and "No Capo" never resets prefs.
  return (
    candidates.find(option => option.isOriginal) ??
    candidates[0] ??
    options.find(option => option.isOriginal)!
  );
}

/**
 * Builds the dropdown options for transposing relative to a song's original
 * tonality, mirroring the legacy renderTransposeControls option list.
 */
export function getTransposeOptions(originalTonality: string): TransposeOption[] {
  const baseMatch = originalTonality.match(/^([A-H][#b]?)(.*)$/);
  const baseRoot = baseMatch ? baseMatch[1] : originalTonality;
  const baseSuffix = baseMatch ? baseMatch[2] : '';

  const normalizedBaseRoot = NORMALIZE_MAP[baseRoot] || baseRoot;
  const baseIndex = CHORDS.indexOf(normalizedBaseRoot);

  return DISPLAY_SCALE.map(note => {
    const normalizedNote = NORMALIZE_MAP[note] || note;
    const noteIndex = CHORDS.indexOf(normalizedNote);
    let steps = noteIndex - baseIndex;

    if (steps > 6) steps -= 12;
    if (steps < -6) steps += 12;

    const isOriginal = steps === 0 && note === baseRoot;
    const useFlats = note.includes('b') || FLAT_NOTES.has(note);
    const tonalityName = `${note}${baseSuffix}`;

    return {
      label: isOriginal ? `${tonalityName} (Original)` : tonalityName,
      tonalityName,
      steps,
      useFlats,
      isOriginal,
    };
  });
}
