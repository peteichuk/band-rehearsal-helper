import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { ZoomControls } from '@/components/song-detail/ZoomControls';
import { ColumnSelect } from '@/components/song-detail/ColumnSelect';
import { useGlobalDisplayDefaultsFor } from '@/hooks/useGlobalDisplayDefaults';
import type { Orientation } from '@/lib/songDisplayConfig';

const PREVIEW_LINES = [
  { chord: 'G          D', lyric: 'Sample lyric line one' },
  { chord: 'Em         C', lyric: 'Another line to preview' },
];

// Same divider used between controls on the song page itself (SongControlsPanel).
const DIVIDER = <div className="h-9 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />;

interface OrientationCardProps {
  orientation: Orientation;
  label: string;
}

/** One orientation's font size + column default + live preview — editable regardless of how the device is held right now. */
function OrientationCard({ orientation, label }: OrientationCardProps) {
  const { t } = useTranslation();
  const { fontSize, setFontSize, columnClass, setColumnClass } =
    useGlobalDisplayDefaultsFor(orientation);

  return (
    <div className="space-y-2 rounded border border-gray-200 dark:border-gray-700 p-2">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
        <Smartphone
          className={orientation === 'landscape' ? 'size-3.5 rotate-90' : 'size-3.5'}
          aria-hidden="true"
        />
        {t(label)}
      </h4>

      <div className="flex items-center gap-3">
        <ZoomControls fontSize={fontSize} onChange={setFontSize} />
        {DIVIDER}
        <ColumnSelect value={columnClass} onChange={setColumnClass} />
      </div>

      <div>
        <p className="text-xs text-gray-900 dark:text-gray-100 mb-1">{t('Preview')}</p>
        <div className="rounded border border-gray-200 dark:border-gray-700 p-2 overflow-hidden">
          <div
            className={`song-preview font-sans text-gray-800 dark:text-gray-200 ${columnClass}`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {PREVIEW_LINES.map((line, index) => (
              <div key={index} className="leading-none mb-1">
                <div className="whitespace-pre-wrap text-blue-600 dark:text-blue-400">
                  {line.chord}
                </div>
                <div className="whitespace-pre-wrap">{t(line.lyric)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Global font size/column defaults, one set per orientation — any song that
 * hasn't been individually adjusted on its own page picks the matching one
 * up automatically. Both are editable here regardless of how the device is
 * currently held, since you'd otherwise have to physically rotate it to set
 * up the other one.
 */
export function SettingsAppearanceSection() {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t(
          "Defaults for any song you haven't zoomed/changed columns on individually — remembered separately for each orientation."
        )}
      </p>
      <OrientationCard orientation="portrait" label="Portrait" />
      <OrientationCard orientation="landscape" label="Landscape" />
    </div>
  );
}
