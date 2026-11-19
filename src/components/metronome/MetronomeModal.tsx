import { useTranslation } from 'react-i18next';
import { cn } from 'cn';
import { Dialog, DialogContent, DialogTitle, dialogOverlayClassName } from '@/components/ui/dialog';
import { LocalMetronomePanel } from '@/components/metronome/LocalMetronomePanel';
import { useAppPreferences } from '@/lib/appPreferences';
import { getTimeSignatureIdFromLabel } from '@/components/metronome/timeSignatures';

interface MetronomeModalProps {
  open: boolean;
  onClose: () => void;
  hasOpenedOnce: boolean;
  /**
   * Identifies the current route — the metronome resets (and stops) when it
   * moves to a different section, but not between songs (see `panelKey`).
   */
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
  const { metronomeDefaultTimeSignatureId, metronomeDefaultBpm } = useAppPreferences();

  if (!hasOpenedOnce) return null;
  // Every song shares one key, so flipping prev/next keeps the same panel
  // (and its running engine) alive — it just re-seeds BPM/meter/sound from
  // the new song (see useSyncedMetronomePreset). Leaving the song section
  // still remounts, which stops it.
  const panelKey = resetKey.startsWith('/song/') ? '/song' : resetKey;
  const resolvedBpm = bpm || metronomeDefaultBpm;
  const initialTimeSignatureId = getTimeSignatureIdFromLabel(
    timeSignature,
    metronomeDefaultTimeSignatureId
  );

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
          'w-auto max-w-[calc(100%-20px)] sm:max-w-[660px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl',
          !open && 'hidden'
        )}
      >
        <DialogTitle className="pl-10 text-center">{t('Metronome')}</DialogTitle>

        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          <LocalMetronomePanel
            key={panelKey}
            bpm={resolvedBpm}
            timeSignatureId={initialTimeSignatureId}
            sheetHasBpm={Boolean(bpm)}
            songName={songName}
            onPlayingChange={onPlayingChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
