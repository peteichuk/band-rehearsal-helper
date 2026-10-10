import { useMemo, useSyncExternalStore } from 'react';
import {
  addSongGroup,
  removeSongGroup,
  getLocalGroupsSnapshot,
  subscribeLocalGroups,
} from '@/lib/localGroups';

export function useLocalGroups() {
  const groups = useSyncExternalStore(subscribeLocalGroups, getLocalGroupsSnapshot);

  const allGroupNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(groups).forEach(list => list.forEach(name => names.add(name)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [groups]);

  return {
    groups,
    getGroups: (songName: string): string[] => groups[songName] ?? [],
    addGroup: addSongGroup,
    removeGroup: removeSongGroup,
    allGroupNames,
  };
}
