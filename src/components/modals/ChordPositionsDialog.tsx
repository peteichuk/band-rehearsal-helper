import { useSyncExternalStore } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChordDiagram } from '@/components/chords/ChordDiagram';
import { CHORD_INSTRUMENTS, type ChordInstrument } from '@/lib/chords/chordDiagrams';
import {
  getChordPositionsSnapshot,
  listChordPositionOverrides,
  resetChordPosition,
  resetChordPositionsForInstrument,
  subscribeChordPositions,
} from '@/lib/chordPositions';

const DIAGRAM_WIDTH = 64;

interface ChordPositionsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Every saved fingering override: where it applies, chord, default → chosen diagram, and a remove button. */
export function ChordPositionsDialog({ open, onClose }: ChordPositionsDialogProps) {
  const { t } = useTranslation();
  const snapshot = useSyncExternalStore(subscribeChordPositions, getChordPositionsSnapshot);
  const rows = listChordPositionOverrides(snapshot);

  const instrumentLabel = (instrument: string) =>
    instrument === 'guitar' ? t('Guitar') : instrument === 'ukulele' ? t('Ukulele') : t('Piano');

  const handleResetInstrument = (instrument: ChordInstrument) => {
    const name = instrumentLabel(instrument);
    if (
      window.confirm(
        t('Reset all chord positions ({{instrument}})? This cannot be undone.', {
          instrument: name,
        })
      )
    ) {
      resetChordPositionsForInstrument(instrument);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-[calc(100%-20px)] sm:max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogTitle>{t('Chord positions')}</DialogTitle>

        {rows.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Nothing cached yet.')}</p>
        ) : (
          <div className="min-h-0 space-y-4 overflow-y-auto">
            {CHORD_INSTRUMENTS.map(instrument => {
              const group = rows.filter(row => row.instrument === instrument);
              if (group.length === 0) return null;
              return (
                <section key={instrument}>
                  <h4 className="mb-1 text-sm font-semibold">{instrumentLabel(instrument)}</h4>
                  <div className="rounded border border-gray-300 dark:border-gray-600">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 text-left text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                          <th className="px-2 py-1 font-medium">{t('Applies to')}</th>
                          <th className="px-2 py-1 font-medium">{t('Chord')}</th>
                          <th className="px-2 py-1 font-medium">{t('Standard')}</th>
                          <th className="w-6" />
                          <th className="px-2 py-1 font-medium">{t('Chosen')}</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.map(row => (
                          <tr
                            key={`${row.scope}|${row.songName ?? ''}|${row.instrument}|${row.chord}`}
                            className="border-t border-gray-300 dark:border-gray-600"
                          >
                            <td className="px-2 py-1 align-middle">
                              {row.scope === 'global' ? t('All songs') : row.songName}
                            </td>
                            <td className="px-2 py-1 align-middle">
                              <strong className="text-blue-600 dark:text-blue-400">
                                {row.chord}
                              </strong>
                            </td>
                            <td className="px-2 py-1 align-middle">
                              <div className="inline-block rounded border border-gray-300 p-1 dark:border-gray-600">
                                <ChordDiagram
                                  chord={row.chord}
                                  instrument={row.instrument}
                                  width={DIAGRAM_WIDTH}
                                  positionIndex={0}
                                />
                              </div>
                            </td>
                            <td className="align-middle">
                              <ArrowRight className="size-4" />
                            </td>
                            <td className="px-2 py-1 align-middle">
                              <div className="inline-block rounded border border-gray-300 p-1 dark:border-gray-600">
                                <ChordDiagram
                                  chord={row.chord}
                                  instrument={row.instrument}
                                  width={DIAGRAM_WIDTH}
                                  positionIndex={row.index}
                                />
                              </div>
                            </td>
                            <td className="px-1 py-1 align-middle">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  resetChordPosition(
                                    row.scope,
                                    row.songName,
                                    row.instrument,
                                    row.chord
                                  )
                                }
                                title={t('Remove from cache')}
                              >
                                <Trash2 className="size-5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-2"
                    onClick={() => handleResetInstrument(instrument)}
                  >
                    {t('Reset Chord Positions')}
                  </Button>
                </section>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
