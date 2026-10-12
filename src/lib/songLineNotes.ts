const STORAGE_KEY = 'songLineNotes';

type Listener = () => void;
// songName -> lineKey ("sectionIndex:lineIndex") -> note text
type Store = Record<string, Record<string, string>>;

const EMPTY_NOTES: Record<string, string> = {};

function loadFromStorage(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

let store = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

/**
 * Personal cues like "I come in here" — kept purely local (never written to
 * the shared Google Sheet), keyed per song and per line so they survive
 * transpose/column/font changes but stay tied to that exact line of text.
 */
export function getSongLineNotes(songName: string): Record<string, string> {
  return store[songName] ?? EMPTY_NOTES;
}

export function setSongLineNote(songName: string, lineKey: string, note: string) {
  const songNotes = { ...(store[songName] ?? {}), [lineKey]: note };
  store = { ...store, [songName]: songNotes };
  persist();
}

export function deleteSongLineNote(songName: string, lineKey: string) {
  const songNotes = store[songName];
  if (!songNotes || !(lineKey in songNotes)) return;
  const nextSongNotes = { ...songNotes };
  delete nextSongNotes[lineKey];

  const nextStore = { ...store };
  if (Object.keys(nextSongNotes).length === 0) {
    // No notes left for this song — drop the key entirely rather than
    // leaving an empty `{}` behind for every song anyone ever annotated.
    delete nextStore[songName];
  } else {
    nextStore[songName] = nextSongNotes;
  }
  store = nextStore;
  persist();
}

export function subscribeSongLineNotes(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
