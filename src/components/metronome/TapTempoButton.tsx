import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_BPM = 20;
const MAX_BPM = 280;
const TAP_RESET_GAP_MS = 2000;
const MAX_TAPS_TRACKED = 8;

interface TapTempoButtonProps {
  onChange: (bpm: number) => void;
}

export function TapTempoButton({ onChange }: TapTempoButtonProps) {
  const { t } = useTranslation();
  const tapTimesRef = useRef<number[]>([]);

  const handleTap = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    const last = taps[taps.length - 1];
    if (last !== undefined && now - last > TAP_RESET_GAP_MS) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > MAX_TAPS_TRACKED) taps.shift();

    if (taps.length < 2) return;

    const intervals = taps.slice(1).map((time, index) => time - taps[index]);
    const averageIntervalMs =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = Math.round(60000 / averageIntervalMs);
    onChange(Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)));
  };

  return (
    <Button type="button" variant="outline" onClick={handleTap}>
      <Hand data-icon="inline-start" />
      {t('Tap')}
    </Button>
  );
}
