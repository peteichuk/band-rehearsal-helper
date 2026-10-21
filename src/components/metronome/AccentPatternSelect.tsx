import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AccentPattern } from '@/components/metronome/timeSignatures';

interface AccentPatternSelectProps {
  patterns: AccentPattern[];
  value: string;
  onChange: (id: string) => void;
}

export function AccentPatternSelect({ patterns, value, onChange }: AccentPatternSelectProps) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {patterns.map(pattern => (
          <SelectItem key={pattern.id} value={pattern.id}>
            {/* Generated "Accent 1+2" style labels have no translation key —
                stay as-is, same as time signature labels (musical notation
                reads fine untranslated); only the fixed Off/On/Custom labels
                below are real translation targets. */}
            {t(pattern.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
