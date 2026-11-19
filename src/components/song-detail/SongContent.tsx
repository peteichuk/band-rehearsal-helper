import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { splitIntoSections, splitLineIntoSegments } from '@/lib/chords/parseLine';
import { transposeChord, type ChordNotation } from '@/lib/chords/transpose';
import type { ChordDiagramSetting } from '@/lib/chords/chordDiagrams';
import { ChordPopover, type OpenChord } from '@/components/chords/ChordPopover';
import { ChordStrip } from '@/components/chords/ChordStrip';
import { ChordSongContext } from '@/hooks/useChordPositions';
import { ChordLine } from '@/components/song-detail/ChordLine';
import { InlineNote } from '@/components/song-detail/InlineNote';
import { selectionAwareClick } from '@/lib/selectionAwareClick';
import { useSongLineNotes } from '@/hooks/useSongLineNotes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SongContentProps {
  songName: string;
  text: string;
  steps: number;
  useFlats: boolean;
  columnClass?: string;
  hideTextLine?: boolean;
  hideChordLine?: boolean;
  fontSize?: number;
  chordInstrument?: ChordDiagramSetting;
  showChordStrip?: boolean;
  inlineChordDiagrams?: boolean;
  /** Percent of the default diagram size. */
  chordDiagramScale?: number;
  chordNotation?: ChordNotation;
  /** False (Play mode): existing notes still show, but tapping a line/title no longer opens the note editor. */
  notesEditable?: boolean;
  /** False (Play mode): tapping a chord no longer opens its diagram popover (a tap there just toggles the bar). */
  chordTapEnabled?: boolean;
}

const DEFAULT_FONT_SIZE = 16;

export function SongContent({
  songName,
  text,
  steps,
  useFlats,
  columnClass = 'col-auto',
  hideTextLine = false,
  hideChordLine = false,
  fontSize,
  chordInstrument = 'off',
  showChordStrip = false,
  inlineChordDiagrams = false,
  chordDiagramScale = 100,
  chordNotation = 'american',
  notesEditable = true,
  chordTapEnabled = true,
}: SongContentProps) {
  const { t } = useTranslation();
  const sections = useMemo(() => splitIntoSections(text), [text]);
  const { notes, setNote, deleteNote } = useSongLineNotes(songName);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [openChord, setOpenChord] = useState<OpenChord | null>(null);

  // Every distinct chord of the song as it's displayed (transposed), in
  // order of first appearance — what the bottom strip lists.
  const uniqueChords = useMemo(() => {
    const seen = new Set<string>();
    for (const section of sections) {
      for (const line of section.lines) {
        for (const segment of splitLineIntoSegments(line)) {
          if (segment.type === 'chord') seen.add(transposeChord(segment.value, steps, useFlats));
        }
      }
    }
    return [...seen];
  }, [sections, steps, useFlats]);

  const openEditor = (lineKey: string) => {
    setEditingKey(lineKey);
    setDraft(notes[lineKey] ?? '');
  };

  const closeEditor = () => setEditingKey(null);

  const saveNote = () => {
    if (!editingKey) return;
    const trimmed = draft.trim();
    if (trimmed) setNote(editingKey, trimmed);
    else deleteNote(editingKey);
    closeEditor();
  };

  const removeNote = () => {
    if (!editingKey) return;
    deleteNote(editingKey);
    closeEditor();
  };

  return (
    <ChordSongContext.Provider value={songName}>
      <div
        id="songContent"
        className={cn(
          'font-sans text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 overflow-y-visible',
          columnClass
        )}
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      >
        {sections.map((section, sectionIndex) => {
          const titleKey = `title:${sectionIndex}`;
          return (
            <div key={sectionIndex} className="pt-4">
              <section className="song-section break-inside-avoid px-2 rounded border border-blue-200 dark:border-blue-900 relative overflow-y-visible">
                {section.title && (
                  <strong
                    onClick={
                      notesEditable ? selectionAwareClick(() => openEditor(titleKey)) : undefined
                    }
                    className="font-semibold text-gray-900 dark:text-white relative bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-900 py-1 px-2 -top-3 z-10 inline-block leading-none"
                  >
                    {section.title}
                  </strong>
                )}
                <div className="section-body relative -top-2">
                  {section.title && notes[titleKey] && (
                    <InlineNote
                      note={notes[titleKey]}
                      onClick={
                        notesEditable ? selectionAwareClick(() => openEditor(titleKey)) : undefined
                      }
                      fontSize={fontSize}
                    />
                  )}
                  {section.lines.map((line, lineIndex) => {
                    const lineKey = `${sectionIndex}:${lineIndex}`;
                    return (
                      <ChordLine
                        key={lineIndex}
                        line={line}
                        steps={steps}
                        useFlats={useFlats}
                        hideTextLine={hideTextLine}
                        hideChordLine={hideChordLine}
                        note={notes[lineKey]}
                        onLineClick={notesEditable ? () => openEditor(lineKey) : undefined}
                        fontSize={fontSize}
                        inlineDiagramInstrument={
                          inlineChordDiagrams && chordInstrument !== 'off'
                            ? chordInstrument
                            : undefined
                        }
                        diagramScale={chordDiagramScale / 100}
                        chordNotation={chordNotation}
                        onChordClick={
                          chordInstrument === 'off' || !chordTapEnabled
                            ? undefined
                            : (chord, element) => setOpenChord({ chord, anchor: element })
                        }
                      />
                    );
                  })}
                </div>
              </section>
            </div>
          );
        })}
      </div>

      {chordInstrument !== 'off' && (
        <>
          {showChordStrip && (
            <ChordStrip
              chords={uniqueChords}
              instrument={chordInstrument}
              scale={chordDiagramScale / 100}
              chordNotation={chordNotation}
            />
          )}
          <ChordPopover
            open={openChord}
            onClose={() => setOpenChord(null)}
            instrument={chordInstrument}
            fontSize={fontSize ?? DEFAULT_FONT_SIZE}
            scale={chordDiagramScale / 100}
            chordNotation={chordNotation}
          />
        </>
      )}

      <Dialog open={editingKey !== null} onOpenChange={open => !open && closeEditor()}>
        <DialogContent className="max-w-[calc(100%-20px)]">
          <DialogHeader>
            <DialogTitle>{t('Note')}</DialogTitle>
          </DialogHeader>
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              // Enter saves (like a chat input); Shift+Enter still inserts a newline.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveNote();
              }
            }}
            placeholder={t('e.g. I come in here')}
            // text-base (16px), not the dialog's inherited text-sm (14px) —
            // iOS/Android auto-zoom the viewport on focusing any input under
            // 16px, and that zoom can stay stuck after the dialog closes.
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <DialogFooter>
            {editingKey && notes[editingKey] && (
              <Button variant="outline" onClick={removeNote}>
                {t('Delete')}
              </Button>
            )}
            <Button onClick={saveNote}>{t('Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChordSongContext.Provider>
  );
}
