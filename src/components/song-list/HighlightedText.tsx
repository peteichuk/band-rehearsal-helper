import type { ReactNode } from 'react';
import { findWordSpan, queryWords, type WordSpan } from '@/lib/songs/search';

interface HighlightedTextProps {
  text: string;
  /** The active search query — words are matched case-insensitively. */
  query: string;
}

/** Sorts by start, and folds any overlapping/touching spans into one — two query words can land on overlapping windows once fuzzy matching is involved. */
function mergeSpans(spans: WordSpan[]): WordSpan[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: WordSpan[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  return merged;
}

/**
 * A fuzzy span the same length as `word` is a one-letter *substitution* —
 * only `length - 1` of its characters actually are the letters searched
 * for, the rest is whatever was really in the song. Highlighting the whole
 * span marked a letter nobody typed (e.g. "дро" fuzzily hitting "иро" would
 * highlight the "и" too, which matched nothing — it's not a wildcard).
 * Splits the span into the runs of characters that do match, dropping the
 * one substituted character in between. A length-differing fuzzy span (an
 * inserted/missing letter) has no such "extra" character — every position
 * in it is part of the real word — so it's returned unchanged.
 */
function splitSubstitutionSpan(span: WordSpan, word: string, lowerText: string): WordSpan[] {
  const windowText = lowerText.slice(span.start, span.end);
  if (windowText.length !== word.length || windowText === word) return [span];

  const parts: WordSpan[] = [];
  let runStart: number | null = null;
  for (let i = 0; i < windowText.length; i++) {
    if (windowText[i] === word[i]) {
      if (runStart === null) runStart = i;
    } else if (runStart !== null) {
      parts.push({ start: span.start + runStart, end: span.start + i });
      runStart = null;
    }
  }
  if (runStart !== null) parts.push({ start: span.start + runStart, end: span.end });
  return parts;
}

/**
 * Highlights every match of `query` inside `text` in `<mark>` — via
 * findWordSpan (search.ts), the same exact-or-one-edit-fuzzy matcher
 * searchSongs/findMatchingLine use to decide a song matches at all. Without
 * sharing that logic, a result that only matched fuzzily (e.g. a lyrics
 * line with one misremembered letter) would show up with nothing actually
 * highlighted in it.
 */
export function HighlightedText({ text, query }: HighlightedTextProps) {
  const words = queryWords(query);
  const rawQuery = query.trim().toLowerCase();
  if (words.length === 0 && !rawQuery) return <>{text}</>;

  const lower = text.toLowerCase();
  const rawSpans = words.flatMap(word => {
    const span = findWordSpan(word, lower);
    return span ? splitSubstitutionSpan(span, word, lower) : [];
  });

  // The same "raw query continues straight into a real word" hint
  // searchSongs ranks on (search.ts's phraseBonus) — a still-unfinished
  // trailing word (e.g. "м" in "боже мій м") is dropped from `words`
  // entirely so it can't force a match on its own, but once this song
  // already matched, highlighting as much of what was actually typed as
  // possible means marking it too when it genuinely continues into "мене".
  const phraseIndex = rawQuery ? lower.indexOf(rawQuery) : -1;
  if (phraseIndex !== -1) rawSpans.push({ start: phraseIndex, end: phraseIndex + rawQuery.length });

  const spans = mergeSpans(rawSpans);
  if (spans.length === 0) return <>{text}</>;

  // Wrapped in one <span> (not a bare Fragment) so this is a single flex
  // item wherever it's rendered — a Fragment's children flatten straight
  // into the parent, so each text/mark part became its own flex child and
  // picked up the parent's own `gap` as unwanted spacing around the match.
  const nodes: ReactNode[] = [];
  let cursor = 0;
  spans.forEach((span, index) => {
    if (span.start > cursor) nodes.push(text.slice(cursor, span.start));
    nodes.push(
      <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 text-inherit rounded">
        {text.slice(span.start, span.end)}
      </mark>
    );
    cursor = span.end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <span>{nodes}</span>;
}
