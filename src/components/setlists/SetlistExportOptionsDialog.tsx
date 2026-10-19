import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface SetlistExportExtrasSelection {
  lineNotes: boolean;
  tonality: boolean;
  metronomePresets: boolean;
}

const DEFAULT_SELECTION: SetlistExportExtrasSelection = {
  lineNotes: false,
  tonality: false,
  metronomePresets: false,
};

interface SetlistExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (selection: SetlistExportExtrasSelection) => void;
}

/**
 * Shown after the user confirms which setlists to export — lets them also
 * bundle in per-song data, scoped to just the songs those setlists
 * reference. Off by default, so a plain export stays just the setlist(s).
 */
export function SetlistExportOptionsDialog({
  open,
  onOpenChange,
  onExport,
}: SetlistExportOptionsDialogProps) {
  const [selection, setSelection] = useState<SetlistExportExtrasSelection>(DEFAULT_SELECTION);

  const toggle = (key: keyof SetlistExportExtrasSelection) =>
    setSelection(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) setSelection(DEFAULT_SELECTION);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogTitle>Export options</DialogTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Also include this per-song data, limited to the songs in the setlist(s) you selected:
        </p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={selection.lineNotes}
              onChange={() => toggle('lineNotes')}
              className="h-4 w-4 accent-blue-600"
            />
            Line/label notes
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={selection.tonality}
              onChange={() => toggle('tonality')}
              className="h-4 w-4 accent-blue-600"
            />
            Tonality/Capo choices
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={selection.metronomePresets}
              onChange={() => toggle('metronomePresets')}
              className="h-4 w-4 accent-blue-600"
            />
            Metronome presets
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onExport(selection)}>
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
