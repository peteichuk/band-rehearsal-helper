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
};

function transposeChord(chord, steps) {
  if (!chord) return chord;

  // Parsing slash chords
  if (chord.includes('/')) {
    const parts = chord.split('/');
    // Transpose each part separately
    return parts.map(part => transposeChord(part, steps)).join('/');
  }

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  let [_, root, suffix] = match;

  // normalize Flats to Sharps
  let normalizedRoot = NORMALIZE_MAP[root] || root;

  const index = CHORDS.indexOf(normalizedRoot);
  if (index === -1) return chord;

  // Calculate new index with wrapping
  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  const transposedRoot = CHORDS[newIndex];
  return transposedRoot + suffix;
}

function transposeChordsInSpans(steps) {
  const chordSpans = document.querySelectorAll('span.chord');
  chordSpans.forEach(span => {
    // Save current chord if not already saved
    if (!span.hasAttribute('data-original-chord')) {
      span.setAttribute('data-original-chord', span.textContent.trim());
    }

    const original = span.getAttribute('data-original-chord');
    const transposed = transposeChord(original, steps); // Функція з першої відповіді

    span.textContent = transposed;
  });
}

window.transposeChord = transposeChord;
window.transposeChordsInSpans = transposeChordsInSpans;
