import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTransposeOptions, type TransposeOption } from '@/lib/chords/transpose';

interface TransposeControlsProps {
  originalTonality: string;
  /** Tonality name to pre-select (e.g. from a shared URL), or null for the original key. */
  targetTonality?: string | null;
  onTransposeChange: (option: TransposeOption) => void;
}

export function TransposeControls({
  originalTonality,
  targetTonality,
  onTransposeChange,
}: TransposeControlsProps) {
  const options = useMemo(() => getTransposeOptions(originalTonality), [originalTonality]);

  const initialIndex = useMemo(() => {
    if (targetTonality) {
      const index = options.findIndex(option => option.tonalityName === targetTonality);
      if (index !== -1) return index;
    }
    return options.findIndex(option => option.isOriginal);
  }, [options, targetTonality]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useEffect(() => {
    setSelectedIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const option = options[selectedIndex];
    if (option) onTransposeChange(option);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, options]);

  const step = (delta: 1 | -1) => {
    setSelectedIndex(current => {
      const next = current + delta;
      if (next < 0) return options.length - 1;
      if (next >= options.length) return 0;
      return next;
    });
  };

  return (
    <div className="flex items-center justify-center gap-2 h-9">
      <Button type="button" className="h-9 w-9 p-0 text-white" onClick={() => step(-1)}>
        -
      </Button>
      <Select
        value={String(selectedIndex)}
        onValueChange={value => setSelectedIndex(Number(value))}
      >
        <SelectTrigger className="h-9! min-w-24 bg-primary text-white border-transparent hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/80 [&_svg]:text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={option.tonalityName + index} value={String(index)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" className="h-9 w-9 p-0 text-white" onClick={() => step(1)}>
        +
      </Button>
    </div>
  );
}
