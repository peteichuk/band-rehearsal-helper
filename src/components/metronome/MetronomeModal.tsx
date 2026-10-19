import { useState } from 'react';
import { cn } from 'cn';
import { Dialog, DialogContent, DialogTitle, dialogOverlayClassName } from '@/components/ui/dialog';
import { EngineSwitch, type MetronomeEngine } from '@/components/metronome/EngineSwitch';
import { LocalMetronomePanel } from '@/components/metronome/LocalMetronomePanel';
import { IframeMetronomePanel } from '@/components/metronome/IframeMetronomePanel';
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
  /** Only fires for the local engine — the iframe engine's playback isn't ours to observe. */
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
  const [engine, setEngine] = useState<MetronomeEngine>('local');

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
          'max-w-[calc(100%-20px)] sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl',
          !open && 'hidden'
        )}
      >
        <DialogTitle>Metronome</DialogTitle>

        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          <EngineSwitch value={engine} onChange={setEngine} />

          {engine === 'local' ? (
            <LocalMetronomePanel
              key={resetKey}
              bpm={resolvedBpm}
              timeSignatureId={initialTimeSignatureId}
              songName={songName}
              onPlayingChange={onPlayingChange}
            />
          ) : (
            <IframeMetronomePanel
              key={resetKey}
              bpm={resolvedBpm}
              timeSignatureId={initialTimeSignatureId}
              songName={songName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
