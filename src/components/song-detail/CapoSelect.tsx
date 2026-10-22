import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CAPO_OPTIONS = Array.from({ length: 12 }, (_, i) => i); // 0 (no capo) .. 11 — one per semitone

export function capoLabel(capo: number, t: TFunction): string {
  return capo === 0 ? t('No Capo') : t('Capo (+{{capo}})', { capo });
}

interface CapoSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export function CapoSelect({ value, onChange }: CapoSelectProps) {
  const { t } = useTranslation();
  return (
    <Select value={String(value)} onValueChange={next => onChange(Number(next))}>
      <SelectTrigger className="min-w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CAPO_OPTIONS.map(capo => (
          <SelectItem key={capo} value={String(capo)}>
            {capoLabel(capo, t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
