/**
 * A single beat's click strength: silent, the normal click, a halfway
 * "medium" accent (slightly higher-pitched/louder than normal, short of a
 * full accent), or the full accent.
 */
export type BeatLevel = 'mute' | 'normal' | 'medium' | 'accent';

export interface AccentPattern {
  id: string;
  label: string;
  /** One entry per beat (same length as the time signature's beatsPerBar). */
  accents: BeatLevel[];
}

const BEAT_LEVEL_ORDER: BeatLevel[] = ['mute', 'normal', 'medium', 'accent'];

/** Cycles a single beat's level for the Custom pattern editor: mute → normal → medium → accent → mute. */
export function cycleBeatLevel(level: BeatLevel): BeatLevel {
  const next = BEAT_LEVEL_ORDER.indexOf(level) + 1;
  return BEAT_LEVEL_ORDER[next % BEAT_LEVEL_ORDER.length];
}

export const CUSTOM_PATTERN_ID = 'custom';

export interface TimeSignature {
  id: string;
  label: string;
  /** Audible clicks per bar — the raw numerator (e.g. 12 for 12/8), every one of them clicked. */
  beatsPerBar: number;
  /**
   * denominator / 4 — the time signature's own definition of what note
   * value gets one beat (a quarter note for any /4 meter, an eighth note,
   * half as long, for any /8 meter), applied as a scale on the BPM-derived
   * interval. 1 for /4 meters, 2 for /8 meters (6/8, 7/8, 9/8, 12/8 alike —
   * this isn't specific to compound/triplet-grouped meters, it's just the
   * note-value math every time signature already defines).
   */
  beatUnitScale: number;
  /**
   * Which beat(s) get accented — always has 'off' and, except for the "♩."
   * compound meters, 'on' (first beat only), plus any meter-specific
   * groupings (e.g. 3+3+3+3 for 12/8).
   */
  accentPatterns: AccentPattern[];
}

const OFF = (n: number): AccentPattern => ({
  id: 'off',
  label: 'Accent Off',
  accents: Array(n).fill('normal'),
});

const ON = (n: number): AccentPattern => ({
  id: 'on',
  label: 'Accent On',
  accents: ['accent', ...Array(n - 1).fill('normal')],
});

/** `groups` is how the bar is split, e.g. [3, 3, 3, 3] for a 3+3+3+3 accent on a 12-beat bar. */
function grouping(groups: number[]): AccentPattern {
  const accents: BeatLevel[] = [];
  for (const size of groups) {
    accents.push('accent', ...Array(size - 1).fill('normal'));
  }
  return { id: groups.join('-'), label: `Accent ${groups.join('+')}`, accents };
}

const customPattern = (n: number): AccentPattern => ({
  id: CUSTOM_PATTERN_ID,
  label: 'Custom',
  accents: Array(n).fill('normal'),
});

/**
 * Inserts the Custom entry right after 'on' (or right after 'off', for the
 * `♩.` compound meters that have no 'on') — keeps it in the same spot in
 * every meter's dropdown, directly after the two fixed presets.
 */
function withCustom(n: number, patterns: AccentPattern[]): AccentPattern[] {
  const insertAt = patterns.some(p => p.id === 'on') ? 2 : 1;
  const next = [...patterns];
  next.splice(insertAt, 0, customPattern(n));
  return next;
}

export const TIME_SIGNATURES: TimeSignature[] = [
  {
    id: '2-4',
    label: '2/4',
    beatsPerBar: 2,
    beatUnitScale: 1,
    accentPatterns: withCustom(2, [OFF(2), ON(2)]),
  },
  {
    id: '3-4',
    label: '3/4',
    beatsPerBar: 3,
    beatUnitScale: 1,
    accentPatterns: withCustom(3, [OFF(3), ON(3)]),
  },
  {
    id: '4-4',
    label: '4/4',
    beatsPerBar: 4,
    beatUnitScale: 1,
    accentPatterns: withCustom(4, [OFF(4), ON(4)]),
  },
  {
    id: '5-4',
    label: '5/4',
    beatsPerBar: 5,
    beatUnitScale: 1,
    accentPatterns: withCustom(5, [OFF(5), ON(5), grouping([3, 2]), grouping([2, 3])]),
  },
  {
    id: '5-8',
    label: '5/8',
    beatsPerBar: 5,
    beatUnitScale: 2,
    accentPatterns: withCustom(5, [OFF(5), ON(5), grouping([3, 2]), grouping([2, 3])]),
  },
  {
    id: '6-8',
    label: '6/8',
    beatsPerBar: 6,
    beatUnitScale: 2,
    accentPatterns: withCustom(6, [OFF(6), ON(6), grouping([3, 3]), grouping([2, 2, 2])]),
  },
  {
    id: '6-8-compound',
    label: '6/8 ♩.',
    beatsPerBar: 6,
    beatUnitScale: 2,
    accentPatterns: withCustom(6, [OFF(6), grouping([3, 3])]),
  },
  {
    id: '7-8',
    label: '7/8',
    beatsPerBar: 7,
    beatUnitScale: 2,
    accentPatterns: withCustom(7, [
      OFF(7),
      ON(7),
      grouping([3, 4]),
      grouping([4, 3]),
      grouping([3, 2, 2]),
      grouping([2, 2, 3]),
    ]),
  },
  {
    id: '8-8',
    label: '8/8',
    beatsPerBar: 8,
    beatUnitScale: 2,
    accentPatterns: withCustom(8, [OFF(8), ON(8), grouping([3, 3, 2])]),
  },
  {
    id: '9-8',
    label: '9/8',
    beatsPerBar: 9,
    beatUnitScale: 2,
    accentPatterns: withCustom(9, [
      OFF(9),
      ON(9),
      grouping([3, 3, 3]),
      grouping([4, 3, 2]),
      grouping([3, 4, 2]),
      grouping([4, 5]),
      grouping([4, 2, 3]),
    ]),
  },
  {
    id: '9-8-compound',
    label: '9/8 ♩.',
    beatsPerBar: 9,
    beatUnitScale: 2,
    accentPatterns: withCustom(9, [OFF(9), grouping([3, 3, 3])]),
  },
  {
    id: '10-8',
    label: '10/8',
    beatsPerBar: 10,
    beatUnitScale: 2,
    accentPatterns: withCustom(10, [
      OFF(10),
      ON(10),
      grouping([3, 3, 2, 2]),
      grouping([2, 2, 3, 3]),
    ]),
  },
  {
    id: '11-8',
    label: '11/8',
    beatsPerBar: 11,
    beatUnitScale: 2,
    accentPatterns: withCustom(11, [
      OFF(11),
      ON(11),
      grouping([3, 3, 3, 2]),
      grouping([4, 4, 3]),
      grouping([2, 2, 3, 4]),
    ]),
  },
  {
    id: '12-8',
    label: '12/8',
    beatsPerBar: 12,
    beatUnitScale: 2,
    accentPatterns: withCustom(12, [
      OFF(12),
      ON(12),
      grouping([3, 3, 3, 3]),
      grouping([3, 3, 2, 2, 2]),
      grouping([3, 2, 3, 2, 2]),
      grouping([3, 2, 3, 4]),
    ]),
  },
  {
    id: '12-8-compound',
    label: '12/8 ♩.',
    beatsPerBar: 12,
    beatUnitScale: 2,
    accentPatterns: withCustom(12, [OFF(12), grouping([3, 3, 3, 3])]),
  },
  {
    id: '13-8',
    label: '13/8',
    beatsPerBar: 13,
    beatUnitScale: 2,
    accentPatterns: withCustom(13, [
      OFF(13),
      ON(13),
      grouping([3, 3, 3, 2, 2]),
      grouping([4, 4, 3, 2]),
      grouping([4, 3, 4, 2]),
      grouping([3, 4, 2, 4]),
    ]),
  },
];

export const DEFAULT_TIME_SIGNATURE_ID = '4-4';

export function getTimeSignature(id: string): TimeSignature {
  return TIME_SIGNATURES.find(signature => signature.id === id) ?? TIME_SIGNATURES[2];
}

/** The 'on' pattern (first beat only) when available, else the first non-off/non-custom grouping, else 'off'. */
export function getDefaultAccentPatternId(signature: TimeSignature): string {
  return (
    signature.accentPatterns.find(pattern => pattern.id === 'on')?.id ??
    signature.accentPatterns.find(
      pattern => pattern.id !== 'off' && pattern.id !== CUSTOM_PATTERN_ID
    )?.id ??
    signature.accentPatterns[0].id
  );
}

export function getAccentPattern(signature: TimeSignature, patternId: string): AccentPattern {
  return (
    signature.accentPatterns.find(pattern => pattern.id === patternId) ??
    signature.accentPatterns[0]
  );
}

/**
 * The accent pattern to actually use: `storedId` (e.g. from a persisted
 * per-time-signature preference) when it's one of this signature's own
 * pattern ids, otherwise this signature's default — covers switching to a
 * meter that doesn't have the previously-stored pattern (e.g. no '3+3+3+3'
 * option on 4/4).
 */
export function resolveAccentPatternId(
  signature: TimeSignature,
  storedId: string | undefined
): string {
  const isValid = storedId != null && signature.accentPatterns.some(p => p.id === storedId);
  return isValid ? storedId : getDefaultAccentPatternId(signature);
}

/**
 * Resolves a sheet-style value (e.g. the song's `TimeSignature` cell, written
 * as "4/4", "3/4", "6/8" — the same way a musician would) to its internal id.
 * Falls back to the default when the song has no value or it doesn't match
 * any known signature.
 */
export function getTimeSignatureIdFromLabel(label: string | null | undefined): string {
  const trimmed = label?.trim();
  if (!trimmed) return DEFAULT_TIME_SIGNATURE_ID;
  return (
    TIME_SIGNATURES.find(signature => signature.label === trimmed)?.id ?? DEFAULT_TIME_SIGNATURE_ID
  );
}
