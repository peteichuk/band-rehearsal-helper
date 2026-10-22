import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const options = useMemo(() => getTransposeOptions(originalTonality), [originalTonality]);

  const initialIndex = useMemo(() => {
    if (targetTonality) {
      const index = options.findIndex(option => option.tonalityName === targetTonality);
      if (index !== -1) return index;
    }
    return Math.max(
      options.findIndex(option => option.isOriginal),
      0
    );
  }, [options, targetTonality]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Resyncs to the restored option whenever the song (or its target
  // tonality) changes. This always reads straight off initialIndex/options,
  // never off `selectedIndex` — that state still belongs to whichever song
  // was selected *before*. `options[selectedIndex]` can land on a bogus,
  // unrelated entry for the new song for one tick before this effect
  // corrects it, since options is a brand new array (new song's tonalities)
  // but selectedIndex hasn't been updated yet. Notifying off that stale
  // index was the original bug: it told the parent to save a leftover
  // tonality against the wrong song.
  useEffect(() => {
    setSelectedIndex(initialIndex);
    const option = options[initialIndex];
    if (option) onTransposeChange(option);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex, options]);

  // A real user pick notifies synchronously from the event handler itself —
  // never through an effect keyed on `selectedIndex`, which is exactly what
  // let a stale index slip through above.
  const select = (index: number) => {
    setSelectedIndex(index);
    const option = options[index];
    if (option) onTransposeChange(option);
  };

  const step = (delta: 1 | -1) => {
    let next = selectedIndex + delta;
    if (next < 0) next = options.length - 1;
    if (next >= options.length) next = 0;
    select(next);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button type="button" size="icon" className="min-w-10 text-white" onClick={() => step(-1)}>
        -
      </Button>
      <Select value={String(selectedIndex)} onValueChange={value => select(Number(value))}>
        <SelectTrigger className="min-w-24 bg-primary text-white border-transparent hover:bg-primary/80 dark:bg-primary dark:hover:bg-primary/80 [&_svg]:text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={option.tonalityName + index} value={String(index)}>
              {option.isOriginal
                ? t('{{tonality}} (Original)', { tonality: option.tonalityName })
                : option.tonalityName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="icon" className="min-w-10 text-white" onClick={() => step(1)}>
        +
      </Button>
    </div>
  );
}
