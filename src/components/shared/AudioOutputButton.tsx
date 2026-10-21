import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Speaker } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { AudioOutputDialog } from '@/components/shared/AudioOutputDialog';
import { useAudioOutputConnectivity } from '@/hooks/useAudioOutputConnectivity';

/**
 * Self-contained: owns its own dialog state, so dropping it anywhere just
 * means rendering this one component — nothing else to wire up at the call
 * site. Currently only used from the metronome, but not metronome-specific.
 */
export function AudioOutputButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { device, notConnected } = useAudioOutputConnectivity();

  return (
    <>
      <div className="relative inline-block">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          title={t('Audio output device')}
          className="border-orange-600 dark:border-orange-400"
        >
          <Speaker className="size-4 text-orange-600 dark:text-orange-400" />
        </Button>
        {/* Only present once a non-default device is actually saved —
            color flags whether it's currently connected (green) or not
            (red), same status AudioOutputStatus spells out in text/icon. */}
        {device && (
          <span
            className={cn(
              'absolute -top-1 -right-1 size-2 rounded-full ring-2 ring-background',
              notConnected ? 'bg-red-500' : 'bg-green-500'
            )}
          />
        )}
      </div>
      <AudioOutputDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
