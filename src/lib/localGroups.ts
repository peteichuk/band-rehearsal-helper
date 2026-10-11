const STORAGE_KEY = 'localGroups';

type Listener = () => void;
export type LocalGroups = Record<string, string[]>; // songName -> group labels

function loadFromStorage(): LocalGroups {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalGroups) : {};
  } catch {
    return {};
  }
}

let groups = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

function allGroupNamesFrom(source: LocalGroups): string[] {
  const names = new Set<string>();
  Object.values(source).forEach(list => list.forEach(name => names.add(name)));
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

/**
 * Adds a group label to a song. Case-insensitively reuses an existing label's
 * exact spelling if one already matches (so "acoustic" and "Acoustic" don't
 * fork into two separate groups), strips newlines, and no-ops on duplicates.
 */
export function addSongGroup(songName: string, label: string) {
  const clean = label.replace(/[\r\n]+/g, ' ').trim();
  if (!clean) return;

  const existingNames = allGroupNamesFrom(groups);
  const existingMatch = existingNames.find(name => name.toLowerCase() === clean.toLowerCase());
  const finalLabel = existingMatch ?? clean;

  const current = groups[songName] ?? [];
  if (current.some(name => name.toLowerCase() === finalLabel.toLowerCase())) return;

  groups = { ...groups, [songName]: [...current, finalLabel] };
  persist();
}

export function removeSongGroup(songName: string, label: string) {
  const current = groups[songName] ?? [];
  const next = current.filter(name => name !== label);

  const nextGroups = { ...groups };
  // Drop the key entirely once empty — an empty array still reads as "this
  // song has a tag" to anything checking for the key's presence (e.g. the
  // group-filter dropdown, or the pin/bookmark indicator), not just its
  // contents.
  if (next.length === 0) delete nextGroups[songName];
  else nextGroups[songName] = next;

  groups = nextGroups;
  persist();
}

export function getSongGroups(songName: string): string[] {
  return groups[songName] ?? [];
}

export function getAllGroupNames(): string[] {
  return allGroupNamesFrom(groups);
}

export function getAllLocalGroups(): LocalGroups {
  return groups;
}

export function setAllLocalGroups(next: LocalGroups) {
  groups = next;
  persist();
}

export function resetLocalGroups() {
  groups = {};
  persist();
}

export function subscribeLocalGroups(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocalGroupsSnapshot(): LocalGroups {
  return groups;
}
