import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDarkMode } from '@/hooks/useDarkMode';

interface MetronomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bpm: number | null;
}

export function MetronomeModal({ open, onOpenChange, bpm }: MetronomeModalProps) {
  const isDark = useDarkMode();
  const tempo = bpm || 120;
  const theme = isDark ? 'dark' : 'light';
  const src = `https://guitarapp.com/metronome.html?tempo=${tempo}&timeSignature=2&pattern=0&theme=${theme}&embed=true`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle>Metronome</DialogTitle>
        {open && (
          <iframe
            key={src}
            src={src}
            title="Metronome"
            className="w-full h-[500px] border-0 rounded"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
