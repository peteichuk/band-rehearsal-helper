import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CAPO_OPTIONS = Array.from({ length: 12 }, (_, i) => i); // 0 (no capo) .. 11 — one per semitone

export function capoLabel(capo: number): string {
  return capo === 0 ? 'No Capo' : `Capo (+${capo})`;
}

interface CapoSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export function CapoSelect({ value, onChange }: CapoSelectProps) {
  return (
    <Select value={String(value)} onValueChange={next => onChange(Number(next))}>
      <SelectTrigger className="h-9! min-w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CAPO_OPTIONS.map(capo => (
          <SelectItem key={capo} value={String(capo)}>
            {capoLabel(capo)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
