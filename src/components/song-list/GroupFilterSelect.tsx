import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocalGroups } from '@/hooks/useLocalGroups';
import type { Song } from '@/types/song';

const ALL_GROUPS = '__all__';

interface GroupFilterSelectProps {
  songs: Song[];
  value: string | null;
  onChange: (group: string | null) => void;
}

export function GroupFilterSelect({ songs, value, onChange }: GroupFilterSelectProps) {
  const { t } = useTranslation();
  const { allGroupNames } = useLocalGroups();

  const groups = useMemo(() => {
    const set = new Set<string>(allGroupNames);
    songs.forEach(song => {
      if (song.GroupBy) set.add(song.GroupBy);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [songs, allGroupNames]);

  if (groups.length === 0) return null;

  return (
    <Select
      value={value ?? ALL_GROUPS}
      onValueChange={next => onChange(next === ALL_GROUPS ? null : next)}
    >
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder={t('All groups')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_GROUPS}>{t('All groups')}</SelectItem>
        {groups.map(group => (
          <SelectItem key={group} value={group}>
            {group}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
