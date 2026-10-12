import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { splitIntoSections } from '@/lib/chords/parseLine';
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
}

export function SongContent({
  songName,
  text,
  steps,
  useFlats,
  columnClass = 'col-auto',
  hideTextLine = false,
  hideChordLine = false,
  fontSize,
}: SongContentProps) {
  const sections = useMemo(() => splitIntoSections(text), [text]);
  const { notes, setNote, deleteNote } = useSongLineNotes(songName);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

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
    <>
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
                    onClick={selectionAwareClick(() => openEditor(titleKey))}
                    className="font-semibold text-gray-900 dark:text-white relative bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-900 py-1 px-2 -top-3 z-10 inline-block leading-none cursor-pointer"
                  >
                    {section.title}
                  </strong>
                )}
                <div className="section-body relative -top-2">
                  {section.title && notes[titleKey] && (
                    <InlineNote
                      note={notes[titleKey]}
                      onClick={selectionAwareClick(() => openEditor(titleKey))}
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
                        onLineClick={() => openEditor(lineKey)}
                      />
                    );
                  })}
                </div>
              </section>
            </div>
          );
        })}
      </div>

      <Dialog open={editingKey !== null} onOpenChange={open => !open && closeEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
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
            placeholder="e.g. I come in here"
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <DialogFooter>
            {editingKey && notes[editingKey] && (
              <Button variant="outline" onClick={removeNote}>
                Delete
              </Button>
            )}
            <Button onClick={saveNote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
