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
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {patterns.map(pattern => (
          <SelectItem key={pattern.id} value={pattern.id}>
            {pattern.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
