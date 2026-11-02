import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FilterSelect } from '@/components/shared/FilterSelect';
import type { Song } from '@/types/song';

interface LanguageFilterSelectProps {
  songs: Song[];
  value: string[];
  onChange: (languages: string[]) => void;
}

export function LanguageFilterSelect({ songs, value, onChange }: LanguageFilterSelectProps) {
  const { t } = useTranslation();
  const languages = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(song => {
      if (song.Language) set.add(song.Language);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  if (languages.length === 0) return null;

  const toggle = (language: string) => {
    if (value.includes(language)) onChange(value.filter(v => v !== language));
    else onChange([...value, language]);
  };

  const label =
    value.length === 0 ? t('All languages') : t('Languages ({{count}})', { count: value.length });

  return (
    <FilterSelect label={label}>
      {value.length > 0 && (
        <>
          <DropdownMenuItem onSelect={() => onChange([])}>{t('Clear')}</DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      {languages.map(language => (
        <DropdownMenuCheckboxItem
          key={language}
          checked={value.includes(language)}
          onCheckedChange={() => toggle(language)}
          onSelect={event => event.preventDefault()}
        >
          {language}
        </DropdownMenuCheckboxItem>
      ))}
    </FilterSelect>
  );
}
