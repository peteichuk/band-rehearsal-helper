import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsCheckboxRow } from '@/components/modals/SettingsCheckboxRow';
import { SoundSelect } from '@/components/metronome/SoundSelect';
import { TimeSignatureSelect } from '@/components/metronome/TimeSignatureSelect';
import { previewClickSound } from '@/components/metronome/sounds';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  setMetronomeDefaultBpm,
  setMetronomeDefaultTimeSignatureId,
  setMetronomeFlashIntensity,
  setMetronomeSoundId,
  setMetronomeVisualFlash,
  useAppPreferences,
  type FlashIntensity,
} from '@/lib/appPreferences';

const MIN_BPM = 20;
const MAX_BPM = 280;

/** Metronome defaults — the same stored values the metronome panel itself reads and writes. */
export function SettingsMetronomeSection() {
  const { t } = useTranslation();
  const {
    metronomeVisualFlash,
    metronomeFlashIntensity,
    metronomeSoundId,
    metronomeDefaultTimeSignatureId,
    metronomeDefaultBpm,
  } = useAppPreferences();
  // Typed freely (a half-typed "1" on the way to "140" mustn't snap to 20), committed clamped on blur.
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);

  const commitBpm = () => {
    const parsed = Number.parseInt(bpmDraft ?? '', 10);
    if (!Number.isNaN(parsed)) {
      setMetronomeDefaultBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, parsed)));
    }
    setBpmDraft(null);
  };

  return (
    <div className="space-y-3">
      <SettingsCheckboxRow
        checked={metronomeVisualFlash}
        onChange={setMetronomeVisualFlash}
        label={t('Visual metronome')}
        hint={t('A glow around the screen edge on every beat, brighter on stronger beats.')}
      />
      <div className="space-y-1">
        <p className="text-sm">{t('Flash intensity')}</p>
        <Select
          value={metronomeFlashIntensity}
          disabled={!metronomeVisualFlash}
          onValueChange={value => setMetronomeFlashIntensity(value as FlashIntensity)}
        >
          <SelectTrigger className="w-auto gap-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{t('Subtle')}</SelectItem>
            <SelectItem value="normal">{t('Normal')}</SelectItem>
            <SelectItem value="high">{t('Strong')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="space-y-1">
          <p className="text-sm">{t('Default click sound')}</p>
          <SoundSelect
            value={metronomeSoundId}
            onChange={id => {
              setMetronomeSoundId(id);
              previewClickSound(id);
            }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm">{t('Default tempo (BPM)')}</p>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpmDraft ?? metronomeDefaultBpm}
            onChange={event => setBpmDraft(event.target.value)}
            onBlur={commitBpm}
            onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()}
            // text-base (16px): mobile browsers zoom the page on focusing smaller inputs.
            className="w-24 h-9 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-base"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm">{t('Default time signature')}</p>
          <TimeSignatureSelect
            value={metronomeDefaultTimeSignatureId}
            onChange={setMetronomeDefaultTimeSignatureId}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('The tempo is used for songs whose sheet row has no BPM.')}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t(
          "The sound applies to songs without their own saved metronome preset; the time signature to songs whose sheet row doesn't have one."
        )}
      </p>
    </div>
  );
}
