const CHORDS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NORMALIZE_MAP = {
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

const SHARP_TO_FLAT = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

function transposeChord(chord, steps, useFlats = false) {
  if (!chord) return chord;

  // Parsing slash chords
  if (chord.includes('/')) {
    const parts = chord.split('/');
    // Transpose each part separately
    return parts.map(part => transposeChord(part, steps)).join('/');
  }

  const match = chord.match(/^([A-H][#b]?)(.*)$/);
  if (!match) return chord;

  let [_, root, suffix] = match;

  // normalize Flats to Sharps
  let normalizedRoot = NORMALIZE_MAP[root] || root;

  const index = CHORDS.indexOf(normalizedRoot);
  if (index === -1) return chord;

  // Calculate new index with wrapping
  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  let transposedRoot = CHORDS[newIndex];

  // Choose between sharps and flats
  if (useFlats && SHARP_TO_FLAT[transposedRoot]) {
    transposedRoot = SHARP_TO_FLAT[transposedRoot];
  }

  return transposedRoot + suffix;
}

function transposeChordsInSpans(steps, useFlats = false) {
  const chordSpans = document.querySelectorAll('span.chord');
  chordSpans.forEach(span => {
    // Save current chord if not already saved
    if (!span.hasAttribute('data-original-chord')) {
      span.setAttribute('data-original-chord', span.textContent.trim());
    }

    const original = span.getAttribute('data-original-chord');
    span.textContent = transposeChord(original, steps, useFlats);
  });
}

window.transposeChord = transposeChord;
window.transposeChordsInSpans = transposeChordsInSpans;
