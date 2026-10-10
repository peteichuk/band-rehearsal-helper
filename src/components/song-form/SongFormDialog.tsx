import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

const REQUIRED_HEADERS = new Set(['Name', 'Text']);

function valuesFromSong(song: Song | null | undefined, headers: string[]): FormValues {
  const values: FormValues = {};
  const source = song as unknown as Record<string, unknown> | null | undefined;
  headers.forEach(header => {
    values[header] = source?.[header] ?? '';
  });
  return values;
}

/** Name and Text lead the form (full width); everything else follows in a grid. */
function orderHeaders(headers: string[]): { lead: string[]; rest: string[] } {
  const lead = ['Name', 'Text'].filter(h => headers.includes(h));
  const rest = headers.filter(h => !lead.includes(h));
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
      <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogTitle>{initialSong ? `Edit "${initialSong.Name}"` : 'Add Song'}</DialogTitle>

        <div className="space-y-3">
          {lead.map(header => (
            <FieldRow
              key={header}
              header={header}
              values={values}
              setValues={setValues}
              error={fieldErrors[header]}
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
}: {
  header: string;
  values: FormValues;
  setValues: Dispatch<SetStateAction<FormValues>>;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {header}
        {REQUIRED_HEADERS.has(header) && <span className="text-destructive"> *</span>}
      </label>
      <Field header={header} values={values} setValues={setValues} hasError={Boolean(error)} />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400';
const inputErrorClass = 'border-destructive focus:ring-destructive';

function Field({
  header,
  values,
  setValues,
  hasError,
}: {
  header: string;
  values: FormValues;
  setValues: Dispatch<SetStateAction<FormValues>>;
  hasError: boolean;
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
        value={String(value ?? '')}
        onChange={e => update(e.target.value)}
        rows={14}
        className={cn(inputClass, 'font-mono text-sm', hasError && inputErrorClass)}
      />
    );
  }

  if (header === 'BPM' || header === 'SortingPriority') {
    return (
      <input
        type="number"
        value={value === '' || value == null ? '' : String(value)}
        onChange={e => update(e.target.value === '' ? '' : Number(e.target.value))}
        className={cn(inputClass, hasError && inputErrorClass)}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={e => update(e.target.value)}
      className={cn(inputClass, hasError && inputErrorClass)}
    />
  );
}
