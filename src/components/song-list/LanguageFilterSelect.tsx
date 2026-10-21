import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full sm:w-48 justify-between font-normal"
        >
          {label}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
