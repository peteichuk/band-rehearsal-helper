import type { Song } from '@/types/song';

/** Per-song data the sheet itself doesn't carry — pulled from the local stores (localGroups.ts, localSetlists.ts). */
export interface SongSearchContext {
  /** Local custom tags for this song — separate from the sheet's own GroupBy column. */
  tags?: string[];
  /** Names of every setlist this song has been added to. */
  setlistNames?: string[];
}

type SearchField = 'name' | 'tag' | 'group' | 'setlist' | 'text' | 'language';

/**
 * Splits a query into the words actually used for matching/highlighting.
 * Only the *trailing* word is dropped if it's a single stray letter (almost
 * always an unfinished word, since this feeds a live search-as-you-type
 * box) — requiring it made every result need to contain that one letter
 * *somewhere*, and highlighting it lit up random single letters buried
 * inside unrelated words. A short word anywhere *else* in the query is kept
 * and still required: Ukrainian has plenty of real one-letter words ("я",
 * "є", "і", "в" …), and once the user has typed past one, it's finished,
 * not a still-being-typed fragment — dropping those too made "хто я є"
 * effectively search for "хто" alone, matching any line with "хто" in it
 * instead of specifically the one with all three words.
 */
export function queryWords(query: string): string[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const last = words[words.length - 1];
  const required = last.length < 2 ? words.slice(0, -1) : words;
  return [...new Set(required)];
}

/** How many points a field contributes when every query word matches it exactly — a looser (fuzzy) match earns half. More specific fields (name, tags) outrank less specific ones (lyrics, language). */
const FIELD_WEIGHTS: Record<SearchField, number> = {
  name: 5,
  tag: 4,
  group: 4,
  setlist: 3,
  text: 2,
  language: 1,
};

/**
 * Levenshtein distance between `a` and `b`, but gives up (returns `max + 1`)
 * the moment it's certain the real distance exceeds `max` — callers only
 * ever care whether it's within a small tolerance, not its exact value.
 */
function levenshteinWithin(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1; // every cell in this row is already past tolerance
    prev = curr;
  }
  return prev[b.length];
}

const FUZZY_TOLERANCE = 1; // one missed/extra/wrong letter

export interface WordSpan {
  start: number;
  end: number;
}

/**
 * The first matching span for `word` within `field` (both already
 * lowercased) — an exact substring if there is one, otherwise (for words of
 * 3+ characters, to keep short words precise) the first window within
 * FUZZY_TOLERANCE edits. Null if neither. This is the single source of
 * truth for "does X match Y" in this module — scoring (wordTier),
 * findMatchingLine, and UI highlighting (HighlightedText) all resolve a
 * match through here, so a line that `findMatchingLine` surfaces as a fuzzy
 * match always has a span `HighlightedText` can actually underline; before
 * this was unified, fuzzy-only matches showed a result line with nothing
 * highlighted in it.
 */
export function findWordSpan(word: string, field: string): WordSpan | null {
  if (!field) return null;
  const exactIndex = field.indexOf(word);
  if (exactIndex !== -1) return { start: exactIndex, end: exactIndex + word.length };
  if (word.length < 3) return null;

  const minLen = Math.max(1, word.length - FUZZY_TOLERANCE);
  const maxLen = word.length + FUZZY_TOLERANCE;
  for (let start = 0; start <= field.length - minLen; start++) {
    for (let len = minLen; len <= Math.min(maxLen, field.length - start); len++) {
      if (
        levenshteinWithin(word, field.slice(start, start + len), FUZZY_TOLERANCE) <= FUZZY_TOLERANCE
      ) {
        return { start, end: start + len };
      }
    }
  }
  return null;
}

/** Best match tier for one query word against one field's text: 0 exact, 1 fuzzy (one edit away), null no match at all. */
function wordTier(word: string, field: string): 0 | 1 | null {
  const span = findWordSpan(word, field);
  if (!span) return null;
  return field.slice(span.start, span.end) === word ? 0 : 1;
}

interface FieldMatch {
  /**
   * How close the match is, independent of which field it's in — 1 means
   * every query word matched that field exactly, down to 0.5 when every
   * word only matched fuzzily. This is the *primary* sort key: a precise
   * match buried in the lyrics still beats a fuzzy match on the name.
   */
  precision: number;
  /**
   * Whether the field contains the *raw* query (untrimmed of short words,
   * spaces and all) as one literal substring — a secondary tiebreaker,
   * ahead of field weight. queryWords() drops a trailing 1-letter "word"
   * (almost always a not-yet-finished one, live search-as-you-type) so it
   * can't force a match, but if that stray letter happens to continue
   * exactly into the next real word here (e.g. query "боже мій м" against
   * "Боже мій мене зігрій"), that's a real hint this is the one being
   * typed toward — it should outrank an equally-precise match that doesn't
   * continue that way (e.g. "Боже мій джерело щастя").
   */
  phraseBonus: boolean;
  /** The field's own specificity (name > tags > … > language) — only a tiebreaker between two matches of equal precision and phraseBonus. */
  weight: number;
}

/** A field's match against the whole (whitespace-split) query — null if any query word is entirely absent from it, so a multi-word query only matches a field that covers all of it. */
function fieldMatch(
  words: string[],
  field: string,
  weight: number,
  rawQuery: string
): FieldMatch | null {
  let tierSum = 0;
  for (const word of words) {
    const tier = wordTier(word, field);
    if (tier === null) return null;
    tierSum += tier === 0 ? 2 : 1;
  }
  return { precision: tierSum / (words.length * 2), phraseBonus: field.includes(rawQuery), weight };
}

/** Whether `a` should rank above `b` — precision first, then the raw-phrase continuation hint, then field weight. */
function isBetterMatch(a: FieldMatch, b: FieldMatch): boolean {
  if (a.precision !== b.precision) return a.precision > b.precision;
  if (a.phraseBonus !== b.phraseBonus) return a.phraseBonus;
  return a.weight > b.weight;
}

/** Null if the song doesn't match at all; otherwise its single best field match (see FieldMatch and isBetterMatch). */
function searchMatch(
  song: Song,
  query: string,
  context: SongSearchContext = {}
): FieldMatch | null {
  const words = queryWords(query);
  if (words.length === 0) return null;
  const rawQuery = query.trim().toLowerCase();

  const fields: Array<[string, SearchField]> = [
    [(song.Name ?? '').toLowerCase(), 'name'],
    [(context.tags ?? []).join(' ').toLowerCase(), 'tag'],
    [(song.GroupBy ?? '').toLowerCase(), 'group'],
    [(context.setlistNames ?? []).join(' ').toLowerCase(), 'setlist'],
    [(song.Text ?? '').toLowerCase(), 'text'],
    [(song.Language ?? '').toLowerCase(), 'language'],
  ];

  let best: FieldMatch | null = null;
  for (const [text, field] of fields) {
    const match = fieldMatch(words, text, FIELD_WEIGHTS[field], rawQuery);
    if (match && (!best || isBetterMatch(match, best))) best = match;
  }
  return best;
}

/**
 * The *best*-matching line of `text` (every query word present, exact or
 * fuzzy) — lets a search result show *why* it matched when the match came
 * from the lyrics rather than the name. "Best" means most precise (more
 * exact-word matches, fewer fuzzy ones), not just the first line that
 * happens to cover every word — a later line matching every word exactly
 * beats an earlier one that only got there fuzzily. Null if the query is
 * empty, there's no text, or no single line covers every word.
 */
export function findMatchingLine(text: string | undefined, query: string): string | null {
  const words = queryWords(query);
  if (words.length === 0 || !text) return null;

  let best: { line: string; precision: number } | null = null;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = fieldMatch(words, line.toLowerCase(), 0, '');
    if (match && (!best || match.precision > best.precision)) {
      best = { line, precision: match.precision };
    }
  }
  return best?.line ?? null;
}

/**
 * Filters + ranks songs by a fuzzy, multi-field search: name, lyrics
 * content, language, the sheet's GroupBy, local tags, and any setlist the
 * song's been added to. Tolerant of one missing/extra/wrong letter per
 * word, so a half-remembered phrase from the lyrics still finds the song.
 *
 * Ranked by precision first, the raw-phrase continuation hint second, field
 * weight third (see FieldMatch/isBetterMatch): an exact phrase found in the
 * lyrics outranks a fuzzy match on the name, even though name is the more
 * "specific" field. Ties on all three keep `songs`' own order (Array#sort
 * is a stable sort), so an already pinned-then-alphabetical list stays
 * sensibly ordered within a tier.
 */
export function searchSongs(
  songs: Song[],
  query: string,
  contextFor: (song: Song) => SongSearchContext = () => ({})
): Song[] {
  if (!query.trim()) return songs;

  return songs
    .map(song => ({ song, match: searchMatch(song, query, contextFor(song)) }))
    .filter((entry): entry is { song: Song; match: FieldMatch } => entry.match !== null)
    .sort((a, b) => {
      if (isBetterMatch(a.match, b.match)) return -1;
      if (isBetterMatch(b.match, a.match)) return 1;
      return 0;
    })
    .map(entry => entry.song);
}
