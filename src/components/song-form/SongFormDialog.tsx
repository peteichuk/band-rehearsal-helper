import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pin } from 'lucide-react';
import { ZoomControls, DEFAULT_FONT_SIZE } from '@/components/song-detail/ZoomControls';
import { DISPLAY_SCALE } from '@/lib/chords/transpose';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { cn } from '@/lib/utils';
import { validateSongForm } from '@/lib/validation/songForm';
import type { Song } from '@/types/song';

interface SongFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  /** Song being edited, or null/undefined when creating a new one. */
  initialSong?: Song | null;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

type FormValues = Record<string, unknown>;
type FieldErrors = Record<string, string>;

const REQUIRED_HEADERS = new Set(['Name', 'Text', 'Tonality']);

function valuesFromSong(song: Song | null | undefined, headers: string[]): FormValues {
  const values: FormValues = {};
  const source = song as unknown as Record<string, unknown> | null | undefined;
  headers.forEach(header => {
    values[header] = source?.[header] ?? '';
  });
  return values;
}

// Name and Text lead the form (full width); everything else follows in a
// grid, in this fixed order. Any header not listed here (unexpected sheet
// column) falls back to the end, in whatever order the sheet gave it.
const FIELD_ORDER = [
  'Name',
  'Text',
  'Tonality',
  'BPM',
  'Language',
  'SortingPriority',
  'GroupBy',
  'Holychords',
  'YouTube',
  'Chordify',
  'PinedByDefault',
];

function orderHeaders(headers: string[]): { lead: string[]; rest: string[] } {
  const lead = ['Name', 'Text'].filter(h => headers.includes(h));
  const rest = headers
    .filter(h => !lead.includes(h))
    .sort((a, b) => {
      const indexA = FIELD_ORDER.indexOf(a);
      const indexB = FIELD_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  return { lead, rest };
}

export function SongFormDialog({
  open,
  onOpenChange,
  headers,
  initialSong,
  onSubmit,
}: SongFormDialogProps) {
  const [values, setValues] = useState<FormValues>(() => valuesFromSong(initialSong, headers));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Separate from the song-view zoom — a song's Text can mix lyrics and
  // chords in whatever font the sheet's author likes, so editing deserves
  // its own remembered size.
  const [textFontSize, setTextFontSize] = useLocalStorageState(
    'songFormTextFontSize',
    DEFAULT_FONT_SIZE
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValues(valuesFromSong(initialSong, headers));
      setFieldErrors({});
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSong]);

  const handleSubmit = async () => {
    const errors = validateSongForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const { lead, rest } = orderHeaders(headers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Caps at 800px on larger screens, but never gives up the 1rem
          // gutter the base dialog has on narrow ones — a flat max-w-[800px]
          // would span edge-to-edge with no margin once the viewport drops
          // below ~832px.
          'max-w-[min(800px,calc(100%-2rem))] sm:max-w-[min(800px,calc(100%-2rem))]',
          'max-h-[85vh] overflow-y-auto'
        )}
        onOpenAutoFocus={event => {
          // Radix otherwise focuses the first focusable element itself
          // (Name, since it's first in the DOM) — preventDefault stops that
          // so our own target (Name when adding, start of Text when
          // editing) wins instead of losing a race against it.
          event.preventDefault();
          const target = initialSong ? textAreaRef.current : nameInputRef.current;
          target?.focus();
          if (target instanceof HTMLTextAreaElement) target.setSelectionRange(0, 0);
        }}
      >
        <DialogTitle>{initialSong ? `Edit "${initialSong.Name}"` : 'Add Song'}</DialogTitle>

        <div className="space-y-3">
          {lead.map(header => (
            <FieldRow
              key={header}
              header={header}
              values={values}
              setValues={setValues}
              error={fieldErrors[header]}
              textFontSize={textFontSize}
              onTextFontSizeChange={setTextFontSize}
              fieldRef={
                header === 'Name' ? nameInputRef : header === 'Text' ? textAreaRef : undefined
              }
            />
          ))}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rest.map(header => (
                <FieldRow
                  key={header}
                  header={header}
                  values={values}
                  setValues={setValues}
                  error={fieldErrors[header]}
                  textFontSize={textFontSize}
                  onTextFontSizeChange={setTextFontSize}
                />
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  header,
  values,
  setValues,
  error,
  textFontSize,
  onTextFontSizeChange,
  fieldRef,
}: {
  header: string;
  values: FormValues;
  setValues: Dispatch<SetStateAction<FormValues>>;
  error?: string;
  textFontSize: number;
  onTextFontSizeChange: (next: number) => void;
  fieldRef?: RefObject<HTMLInputElement | null> | RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          {header === 'PinedByDefault' && (
            <Pin
              className={cn(
                'w-3.5 h-3.5',
                values.PinedByDefault === true && 'text-yellow-500 dark:text-yellow-400'
              )}
              fill={values.PinedByDefault === true ? 'currentColor' : 'none'}
            />
          )}
          {header}
          {REQUIRED_HEADERS.has(header) && <span className="text-destructive"> *</span>}
        </label>
        {header === 'Text' && (
          <ZoomControls fontSize={textFontSize} onChange={onTextFontSizeChange} />
        )}
      </div>
      <Field
        header={header}
        values={values}
        setValues={setValues}
        hasError={Boolean(error)}
        textFontSize={textFontSize}
        fieldRef={fieldRef}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

const TEXT_PLACEHOLDER = `Intro (Guitar):
Dm Am E Am

Verse 1:
   Dm             Am
Example verse template ....

Chorus (+Piano):
   Dm              Am
Example chorus template ...

Bridge (+BASS):
   Dm              Am
Example bridge template ...

Instrumental (Piano, Violin solo):
Dm Am

Repeat Chorus 2x:`;

const FIELD_PLACEHOLDERS: Record<string, string> = {
  Name: 'Name of Song...',
  Language: 'EN',
  BPM: '120',
  Holychords: 'https://holychords.pro/...',
  YouTube: 'https://youtube.com/watch?v=...',
  Chordify: 'https://chordify.net/chords/...',
  GroupBy: 'Weeding',
  SortingPriority: '1',
};

const inputClass =
  'w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400';
const inputErrorClass = 'border-destructive focus:ring-destructive';

function Field({
  header,
  values,
  setValues,
  hasError,
  textFontSize,
  fieldRef,
}: {
  header: string;
  values: FormValues;
  setValues: Dispatch<SetStateAction<FormValues>>;
  hasError: boolean;
  textFontSize: number;
  fieldRef?: RefObject<HTMLInputElement | null> | RefObject<HTMLTextAreaElement | null>;
}) {
  const value = values[header];
  const update = (next: unknown) => setValues(prev => ({ ...prev, [header]: next }));

  if (header === 'PinedByDefault') {
    return (
      <input
        type="checkbox"
        checked={value === true}
        onChange={e => update(e.target.checked)}
        className="w-4 h-4"
      />
    );
  }

  if (header === 'Text') {
    return (
      <textarea
        ref={fieldRef as RefObject<HTMLTextAreaElement | null>}
        value={String(value ?? '')}
        onChange={e => update(e.target.value)}
        placeholder={TEXT_PLACEHOLDER}
        style={{ fontSize: `${textFontSize}px` }}
        className={cn(
          inputClass,
          // Must match SongContent/ChordLine's rendering font (font-sans,
          // leading-none) exactly — chords are aligned over lyrics by
          // counting spaces, and that only lines up the same way here as it
          // does in the actual song view if both use the same font. A
          // monospace editing font looks aligned while typing but shifts
          // once rendered with the view's proportional font.
          // Default to 80vh, capped at 700px so it doesn't tower over the
          // screen on tall monitors — chords/lyrics can need a lot of room,
          // so let the user drag it taller (or shorter) from there.
          'font-sans leading-none h-[min(80vh,700px)] resize-y',
          hasError && inputErrorClass
        )}
      />
    );
  }

  if (header === 'Tonality') {
    return (
      <select
        value={String(value ?? '')}
        onChange={e => update(e.target.value)}
        className={cn(inputClass, hasError && inputErrorClass)}
      >
        <option value="">Select tonality…</option>
        {DISPLAY_SCALE.map(note => (
          <option key={note} value={note}>
            {note}
          </option>
        ))}
      </select>
    );
  }

  if (header === 'BPM' || header === 'SortingPriority') {
    return (
      <input
        type="number"
        value={value === '' || value == null ? '' : String(value)}
        onChange={e => update(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={FIELD_PLACEHOLDERS[header]}
        className={cn(inputClass, hasError && inputErrorClass)}
      />
    );
  }

  return (
    <input
      ref={fieldRef as RefObject<HTMLInputElement | null>}
      type="text"
      value={String(value ?? '')}
      onChange={e => update(e.target.value)}
      placeholder={FIELD_PLACEHOLDERS[header]}
      className={cn(inputClass, hasError && inputErrorClass)}
    />
  );
}
