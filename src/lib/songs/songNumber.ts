/**
 * "№3/12 Song title" — a song's 1-based position in the setlist it was opened
 * from and the setlist's length, in front of its title. `number` is null
 * outside a setlist (a plain catalog/favorites browse has no meaningful
 * order), which leaves the title as is. "№" is a symbol, not a word, so it
 * isn't translated.
 */
export function numberedTitle(title: string, number: number | null, total: number): string {
  return number === null ? title : `№${number}/${total} ${title}`;
}
