import { useTranslation } from 'react-i18next';
import { SettingsCheckboxRow } from '@/components/modals/SettingsCheckboxRow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  setChordNotation,
  setHideChordLine,
  setHideTextLine,
  useAppPreferences,
} from '@/lib/appPreferences';
import type { ChordNotation } from '@/lib/chords/transpose';

/** What a song shows by default — the same stored values as the song page's own toggle buttons, so the two always agree. */
export function SettingsSongDisplaySection() {
  const { t } = useTranslation();
  const { hideTextLine, hideChordLine, chordNotation } = useAppPreferences();

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t(
          'What a song shows when you open it. The toggle buttons on a song change the same thing.'
        )}
      </p>
      <SettingsCheckboxRow
        checked={hideTextLine}
        onChange={setHideTextLine}
        label={t('Hide lyric lines')}
        hint={t('Show only the chords.')}
      />
      <SettingsCheckboxRow
        checked={hideChordLine}
        onChange={setHideChordLine}
        label={t('Hide chord lines')}
        hint={t('Show only the lyrics.')}
      />
      <div className="space-y-1">
        <p className="text-sm">{t('Chord notation')}</p>
        <Select value={chordNotation} onValueChange={v => setChordNotation(v as ChordNotation)}>
          <SelectTrigger className="w-auto gap-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="american">{t('American: B, Bb')}</SelectItem>
            <SelectItem value="german">{t('German: H, B')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t(
            'How the note B is written in chords. Songs are read either way, only the display changes.'
          )}
        </p>
      </div>
    </div>
  );
}
