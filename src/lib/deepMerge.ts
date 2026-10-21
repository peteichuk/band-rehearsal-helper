function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges `incoming` onto `local`, recursing into plain objects key by key —
 * a key only `local` has always survives, a key only `incoming` has gets
 * added, and a key both have recurses again (so a deeper key only `local`
 * has still survives, and so on). Arrays and primitives are atomic: whoever
 * has one wins wholesale, never spliced/concatenated together.
 *
 * This is the one place "merge" is actually defined for every per-song
 * store that's shaped as nested records (metronome presets' own
 * `customAccentPatterns`, keyed by time signature, being the motivating
 * case — a shallow `{...local, ...incoming}` there would silently wipe out
 * every time signature's custom pattern except whichever one(s) the
 * incoming side happened to also have). Reuse this instead of writing a new
 * shallow merge for the next nested field — that's exactly how this bug
 * happened the first time.
 */
export function deepMerge<T>(local: T | undefined, incoming: T | undefined): T | undefined {
  if (incoming === undefined) return local;
  if (local === undefined) return incoming;
  if (isPlainObject(local) && isPlainObject(incoming)) {
    const result: Record<string, unknown> = { ...local };
    for (const key of Object.keys(incoming)) {
      result[key] = deepMerge(local[key], incoming[key]);
    }
    return result as T;
  }
  return incoming;
}
