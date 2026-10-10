import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { splitIntoSections } from '@/lib/chords/parseLine';
import { ChordLine } from '@/components/song-detail/ChordLine';

interface SongContentProps {
  text: string;
  steps: number;
  useFlats: boolean;
  columnClass?: string;
  hideTextLine?: boolean;
  hideChordLine?: boolean;
  fontSize?: number;
}

export function SongContent({
  text,
  steps,
  useFlats,
  columnClass = 'col-auto',
  hideTextLine = false,
  hideChordLine = false,
  fontSize,
}: SongContentProps) {
  const sections = useMemo(() => splitIntoSections(text), [text]);

  return (
    <div
      id="songContent"
      className={cn(
        'font-sans text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 overflow-y-visible',
        columnClass
      )}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      {sections.map((section, index) => (
        <div key={index} className="pt-4">
          <section className="song-section break-inside-avoid px-2 rounded border border-blue-200 dark:border-blue-900 relative overflow-y-visible">
            {section.title && (
              <strong className="font-semibold text-gray-900 dark:text-white relative bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-900 py-1 px-2 -top-3 z-10 inline-block leading-none">
                {section.title}
              </strong>
            )}
            <div className="section-body relative -top-2">
              {section.lines.map((line, lineIndex) => (
                <ChordLine
                  key={lineIndex}
                  line={line}
                  steps={steps}
                  useFlats={useFlats}
                  hideTextLine={hideTextLine}
                  hideChordLine={hideChordLine}
                />
              ))}
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
