import { useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from 'cn';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <DialogPrimitive.Root open={open} onOpenChange={next => !next && onClose()} modal={false}>
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Content
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
            'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none',
            !open && 'hidden'
          )}
        >
          <DialogPrimitive.Title className="text-base leading-none font-medium">
            Metronome
          </DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>

          <EngineSwitch value={engine} onChange={setEngine} />

          {engine === 'local' ? (
            <LocalMetronomePanel
              key={resetKey}
              bpm={resolvedBpm}
              timeSignatureId={initialTimeSignatureId}
              onPlayingChange={onPlayingChange}
            />
          ) : (
            <IframeMetronomePanel key={resetKey} bpm={resolvedBpm} />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
