import { useTranslation } from 'react-i18next';
import { cn } from 'cn';
import { Dialog, DialogContent, DialogTitle, dialogOverlayClassName } from '@/components/ui/dialog';
import { LocalMetronomePanel } from '@/components/metronome/LocalMetronomePanel';
import { getTimeSignatureIdFromLabel } from '@/components/metronome/timeSignatures';

interface MetronomeModalProps {
  open: boolean;
  onClose: () => void;
  hasOpenedOnce: boolean;
  /** Identifies the current song (e.g. a route path) — changing it resets the metronome. */
  resetKey: string;
  bpm: number | null;
  /** Song's time signature from the sheet, e.g. "4/4", "6/8". */
  timeSignature: string | null;
  /** The song's own name — identifies its saved metronome preset (tempo/time signature/accent). */
  songName: string | null;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function MetronomeModal({
  open,
  onClose,
  hasOpenedOnce,
  resetKey,
  bpm,
  timeSignature,
  songName,
  onPlayingChange,
}: MetronomeModalProps) {
  const { t } = useTranslation();

  if (!hasOpenedOnce) return null;
  const resolvedBpm = bpm || 120;
  const initialTimeSignatureId = getTimeSignatureIdFromLabel(timeSignature);

  return (
    // `modal={false}` is required here: a modal Radix Dialog permanently
    // engages focus-trapping/hideOthers side effects the first time it
    // mounts, and only releases them on unmount — which never happens for
    // this forceMount'd, always-in-the-DOM dialog. That left the page
    // inert after the first close, so a second open never worked.
    <Dialog open={open} onOpenChange={next => !next && onClose()} modal={false}>
      {/* Radix's own Dialog.Overlay only renders when modal={true} (it's a
          no-op otherwise), so with modal={false} here we render the backdrop
          ourselves, reusing the same classes as the modal dialogs' overlay. */}
      {open && <div className={dialogOverlayClassName} />}
      <DialogContent
        forceMount
        // The content never unmounts (forceMount), so Radix's "click outside
        // closes it" listener stays attached even while hidden. Without this
        // guard, clicking one of our own trigger buttons to reopen it is seen
        // as an outside click and immediately dismisses it again.
        onPointerDownOutside={event => {
          const target = event.detail.originalEvent.target as Element | null;
          if (target?.closest('[data-metronome-trigger]')) {
            event.preventDefault();
          }
        }}
        className={cn(
          // w-auto (overriding the shared dialog's own w-full) so the modal
          // shrink-wraps to its content — e.g. a longer accent pattern or
          // sound label — instead of always sitting at the same fixed width.
          'w-auto max-w-[calc(100%-20px)] sm:max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl',
          !open && 'hidden'
        )}
      >
        <DialogTitle className="pl-10 text-center">{t('Metronome')}</DialogTitle>

        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          <LocalMetronomePanel
            key={resetKey}
            bpm={resolvedBpm}
            timeSignatureId={initialTimeSignatureId}
            songName={songName}
            onPlayingChange={onPlayingChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
