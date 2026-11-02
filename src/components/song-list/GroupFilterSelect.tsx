import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { useLocalGroups } from '@/hooks/useLocalGroups';
import type { Song } from '@/types/song';

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
    <FilterSelect label={value ?? t('All groups')}>
      <DropdownMenuItem onSelect={() => onChange(null)}>
        {t('All groups')}
        {value === null && <Check className="ml-auto size-4" />}
      </DropdownMenuItem>
      {groups.map(group => (
        <DropdownMenuItem key={group} onSelect={() => onChange(group)}>
          {group}
          {value === group && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
      ))}
    </FilterSelect>
  );
}
