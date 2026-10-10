const CHORD_SOURCE =
  '(^|\\s)([A-GH][#b]?(?:m|maj|dim|aug|sus\\d?|[2456789]|11|13)*(?:\\/[A-GH][#b]?(?:m|maj|dim|aug|sus\\d?|[2456789]|11|13)*)*)(?=\\s|$)';

// `matchAll` requires (and internally clones) a `g`-flagged regex, while `.test()`
// mutates `lastIndex` on whatever regex it's called with. Keeping separate instances
// per call site avoids the two use sites corrupting each other's scan position.
const CHORD_PATTERN_GLOBAL = new RegExp(CHORD_SOURCE, 'g');
const CHORD_PATTERN_TEST = new RegExp(CHORD_SOURCE);

export type LineSegment = { type: 'text'; value: string } | { type: 'chord'; value: string };

/** Splits a single lyrics/chords line into alternating text and chord segments. */
export function splitLineIntoSegments(line: string): LineSegment[] {
  const segments: LineSegment[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(CHORD_PATTERN_GLOBAL)) {
    const [full, leading, chord] = match;
    const matchStart = match.index ?? 0;

    const textBefore = line.slice(lastIndex, matchStart) + leading;
    if (textBefore) segments.push({ type: 'text', value: textBefore });

    segments.push({ type: 'chord', value: chord });
    lastIndex = matchStart + full.length;
  }

  const rest = line.slice(lastIndex);
  if (rest) segments.push({ type: 'text', value: rest });

  return segments;
}

export function isChordLine(line: string): boolean {
  return CHORD_PATTERN_TEST.test(line);
}

export interface SongSection {
  title: string | null;
  lines: string[];
}

/** Splits the raw Text field into sections, pulling a "[Verse]"/"Chorus:"-style title off each. */
export function splitIntoSections(text: string): SongSection[] {
  const rawSections = text.trim().split(/\n\s*\n/);

  return rawSections.map(sectionStr => {
    const lines = sectionStr.split('\n');
    let title: string | null = null;

    if (lines.length > 0 && (lines[0].includes(':') || /^\[/.test(lines[0]))) {
      title = lines.shift() ?? null;
    }

    return { title, lines };
  });
}
