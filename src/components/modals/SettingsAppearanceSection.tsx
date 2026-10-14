import { ZoomControls } from '@/components/song-detail/ZoomControls';
import { ColumnSelect } from '@/components/song-detail/ColumnSelect';
import { useGlobalDisplayDefaultsFor } from '@/hooks/useGlobalDisplayDefaults';
import type { Orientation } from '@/lib/songDisplayConfig';

const PREVIEW_LINES = [
  { chord: 'G          D', lyric: 'Sample lyric line one' },
  { chord: 'Em         C', lyric: 'Another line to preview' },
];

interface OrientationCardProps {
  orientation: Orientation;
  label: string;
}

/** One orientation's font size + column default + live preview — editable regardless of how the device is held right now. */
function OrientationCard({ orientation, label }: OrientationCardProps) {
  const { fontSize, setFontSize, columnClass, setColumnClass } =
    useGlobalDisplayDefaultsFor(orientation);

  return (
    <div className="space-y-2 rounded border border-gray-200 dark:border-gray-700 p-2">
      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </h4>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Font size</p>
        <ZoomControls fontSize={fontSize} onChange={setFontSize} />
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Columns</p>
        <ColumnSelect value={columnClass} onChange={setColumnClass} />
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</p>
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
                <div className="whitespace-pre-wrap">{line.lyric}</div>
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
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Defaults for any song you haven't zoomed/changed columns on individually — remembered
        separately for each orientation.
      </p>
      <OrientationCard orientation="portrait" label="Portrait" />
      <OrientationCard orientation="landscape" label="Landscape" />
    </div>
  );
}
