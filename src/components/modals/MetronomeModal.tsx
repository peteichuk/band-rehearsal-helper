import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from 'cn';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MetronomeModalProps {
  open: boolean;
  onClose: () => void;
  /** The iframe URL for the currently running song, or null if never started. */
  src: string | null;
}

export function MetronomeModal({ open, onClose, src }: MetronomeModalProps) {
  if (src === null) return null;

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
          <iframe src={src} title="Metronome" className="w-full h-[500px] border-0 rounded" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
