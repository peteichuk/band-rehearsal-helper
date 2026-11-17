import { useTranslation } from 'react-i18next';
import { SettingsCheckboxRow } from '@/components/modals/SettingsCheckboxRow';
import { ChordInstrumentSelect } from '@/components/song-detail/ChordDiagramControls';
import {
  setChordDiagramInline,
  setChordDiagramInstrument,
  setChordStripVisible,
  useAppPreferences,
} from '@/lib/appPreferences';

/** Chord diagram preferences — the same stored values the song page's own controls read and write. */
export function SettingsChordDiagramsSection() {
  const { t } = useTranslation();
  const { chordDiagramInstrument, chordStripVisible, chordDiagramInline } = useAppPreferences();
  const off = chordDiagramInstrument === 'off';

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t(
          'Tap a chord in a song to see how to play it. Pick an instrument, or turn diagrams off.'
        )}
      </p>
      <ChordInstrumentSelect value={chordDiagramInstrument} onChange={setChordDiagramInstrument} />
      <SettingsCheckboxRow
        checked={chordStripVisible}
        disabled={off}
        onChange={setChordStripVisible}
        label={t('Show all chords below the song')}
        hint={t("A row with a diagram for every chord the song uses, under the song's text.")}
      />
      <SettingsCheckboxRow
        checked={chordDiagramInline}
        disabled={off}
        onChange={setChordDiagramInline}
        label={t('Always show a diagram next to each chord')}
        hint={t("Shifts the chords sideways, so they won't line up with the lyrics under them.")}
      />
    </div>
  );
}
