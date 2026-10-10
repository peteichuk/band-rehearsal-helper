import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ColIcon from '@/assets/icons/col.svg?react';

const COLUMN_OPTIONS = [
  { value: 'col-auto', label: 'Col Auto' },
  { value: 'col-1', label: 'Col 1' },
  { value: 'col-2', label: 'Col 2' },
  { value: 'col-3', label: 'Col 3' },
  { value: 'col-4', label: 'Col 4' },
];

export const DEFAULT_COLUMN_CLASS = 'col-auto';

interface ColumnSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColumnSelect({ value, onChange }: ColumnSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9! w-auto gap-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COLUMN_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <ColIcon className="w-5 h-5" />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
