import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIME_SIGNATURES } from '@/components/metronome/timeSignatures';

interface TimeSignatureSelectProps {
  value: string;
  onChange: (id: string) => void;
}

export function TimeSignatureSelect({ value, onChange }: TimeSignatureSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIME_SIGNATURES.map(signature => (
          <SelectItem key={signature.id} value={signature.id}>
            {signature.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
