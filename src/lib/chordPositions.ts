import type { ChordInstrument } from '@/lib/chords/chordDiagrams';

const GLOBAL_KEY = 'chordPositionsGlobal';
const SONG_KEY = 'chordPositionsBySong';

export type ChordPositionScope = 'global' | 'song' | 'temporary';

/** chord key ("guitar|Em") -> index into that chord's list of fingerings. */
type Picks = Record<string, number>;

interface State {
  global: Picks;
  bySong: Record<string, Picks>;
  /** Session-only (never persisted): gone on reload. */
  temp: Record<string, Picks>;
}

type Listener = () => void;

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

let state: State = {
  global: load<Picks>(GLOBAL_KEY) ?? {},
  bySong: load<Record<string, Picks>>(SONG_KEY) ?? {},
  temp: {},
};
const listeners = new Set<Listener>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(GLOBAL_KEY, JSON.stringify(state.global));
    localStorage.setItem(SONG_KEY, JSON.stringify(state.bySong));
  } catch {
    // ignore (storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

export const chordPositionKey = (instrument: ChordInstrument, chord: string) =>
  `${instrument}|${chord}`;

/** Priority: temporary > this song > all songs > 0 (the database's first fingering). */
export function resolveChordPosition(
  snapshot: State,
  songName: string | null,
  instrument: ChordInstrument,
  chord: string
): number {
  const key = chordPositionKey(instrument, chord);
  return (
    (songName ? snapshot.temp[songName]?.[key] : undefined) ??
    (songName ? snapshot.bySong[songName]?.[key] : undefined) ??
    snapshot.global[key] ??
    0
  );
}

export function hasChordPositionOverride(
  snapshot: State,
  songName: string | null,
  instrument: ChordInstrument,
  chord: string
): boolean {
  const key = chordPositionKey(instrument, chord);
  return (
    key in snapshot.global ||
    (songName !== null &&
      (key in (snapshot.bySong[songName] ?? {}) || key in (snapshot.temp[songName] ?? {})))
  );
}

export function setChordPosition(
  scope: ChordPositionScope,
  songName: string | null,
  instrument: ChordInstrument,
  chord: string,
  index: number
) {
  const key = chordPositionKey(instrument, chord);
  if (scope === 'global') {
    commit({ ...state, global: { ...state.global, [key]: index } });
  } else if (songName) {
    const field = scope === 'song' ? 'bySong' : 'temp';
    commit({
      ...state,
      [field]: { ...state[field], [songName]: { ...state[field][songName], [key]: index } },
    });
  }
}

function without(picks: Picks | undefined, key: string): Picks | undefined {
  if (!picks || !(key in picks)) return picks;
  const next = { ...picks };
  delete next[key];
  return next;
}

/** The pick stored in exactly one scope (no fallback to the others), if any. */
export function getScopedChordPosition(
  snapshot: State,
  scope: ChordPositionScope,
  songName: string | null,
  instrument: ChordInstrument,
  chord: string
): number | undefined {
  const key = chordPositionKey(instrument, chord);
  if (scope === 'global') return snapshot.global[key];
  if (!songName) return undefined;
  return (scope === 'song' ? snapshot.bySong : snapshot.temp)[songName]?.[key];
}

/** Which scope the popover should preselect: the one that currently decides the fingering. */
export function activeChordPositionScope(
  snapshot: State,
  songName: string | null,
  instrument: ChordInstrument,
  chord: string
): ChordPositionScope {
  if (!songName) return 'global';
  const scopes: ChordPositionScope[] = ['temporary', 'song', 'global'];
  return (
    scopes.find(
      scope => getScopedChordPosition(snapshot, scope, songName, instrument, chord) !== undefined
    ) ?? 'song'
  );
}

/** Back to the default fingering for this chord — only in the given scope. */
export function resetChordPosition(
  scope: ChordPositionScope,
  songName: string | null,
  instrument: ChordInstrument,
  chord: string
) {
  const key = chordPositionKey(instrument, chord);
  if (scope === 'global') {
    commit({ ...state, global: without(state.global, key) ?? {} });
    return;
  }
  if (!songName) return;
  const field = scope === 'song' ? 'bySong' : 'temp';
  const map = { ...state[field] };
  const next = without(map[songName], key);
  // Drop the song's entry entirely once its last override is gone, so no
  // empty objects linger in storage.
  if (next && Object.keys(next).length > 0) map[songName] = next;
  else delete map[songName];
  commit({ ...state, [field]: map });
}

export interface ChordPositionOverride {
  scope: 'global' | 'song';
  songName: string | null;
  instrument: ChordInstrument;
  chord: string;
  index: number;
}

function parseKey(key: string): { instrument: ChordInstrument; chord: string } {
  const i = key.indexOf('|');
  return { instrument: key.slice(0, i) as ChordInstrument, chord: key.slice(i + 1) };
}

/** Every persisted override (global first, then per song) — for the Settings table. */
export function listChordPositionOverrides(snapshot: State): ChordPositionOverride[] {
  const rows: ChordPositionOverride[] = Object.entries(snapshot.global).map(([key, index]) => ({
    scope: 'global',
    songName: null,
    index,
    ...parseKey(key),
  }));
  for (const [songName, picks] of Object.entries(snapshot.bySong)) {
    for (const [key, index] of Object.entries(picks)) {
      rows.push({ scope: 'song', songName, index, ...parseKey(key) });
    }
  }
  return rows;
}

/** Drops every override (all scopes) for one instrument; the others stay. */
export function resetChordPositionsForInstrument(instrument: ChordInstrument) {
  const prefix = `${instrument}|`;
  const strip = (picks: Picks): Picks =>
    Object.fromEntries(Object.entries(picks).filter(([key]) => !key.startsWith(prefix)));
  const stripSongs = (map: Record<string, Picks>) =>
    Object.fromEntries(
      Object.entries(map)
        .map(([song, picks]) => [song, strip(picks)] as const)
        .filter(([, picks]) => Object.keys(picks).length > 0)
    );
  commit({
    global: strip(state.global),
    bySong: stripSongs(state.bySong),
    temp: stripSongs(state.temp),
  });
}

/** The persisted overrides (never the session-only temporary ones), for Settings → Backup. */
export interface ChordPositionsBackup {
  global: Record<string, number>;
  bySong: Record<string, Record<string, number>>;
}

export function getChordPositionsBackup(): ChordPositionsBackup {
  return { global: state.global, bySong: state.bySong };
}

/** Imported picks win over existing ones for the same chord; everything else is kept. */
export function mergeChordPositions(incoming: Partial<ChordPositionsBackup>) {
  const bySong = { ...state.bySong };
  for (const [songName, picks] of Object.entries(incoming.bySong ?? {})) {
    bySong[songName] = { ...bySong[songName], ...picks };
  }
  commit({ ...state, global: { ...state.global, ...incoming.global }, bySong });
}

export function countChordPositionOverrides(): number {
  return (
    Object.keys(state.global).length +
    Object.values(state.bySong).reduce((sum, picks) => sum + Object.keys(picks).length, 0)
  );
}

export function resetAllChordPositions() {
  commit({ global: {}, bySong: {}, temp: {} });
}

export function subscribeChordPositions(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getChordPositionsSnapshot(): State {
  return state;
}
