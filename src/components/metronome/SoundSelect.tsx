import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLICK_SOUNDS, type ClickSoundId } from '@/components/metronome/sounds';

interface SoundSelectProps {
  value: ClickSoundId;
  onChange: (id: ClickSoundId) => void;
}

export function SoundSelect({ value, onChange }: SoundSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CLICK_SOUNDS.map(sound => (
          <SelectItem key={sound.id} value={sound.id}>
            {sound.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
