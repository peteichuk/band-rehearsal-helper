import { Check, X } from 'lucide-react';
import { useAudioOutputConnectivity } from '@/hooks/useAudioOutputConnectivity';

/**
 * Shows which output device is currently selected (or "System default"),
 * with a checkmark if it's actually connected, or a red cross plus an
 * orange warning below if it isn't — self-contained, so it can sit next to
 * AudioOutputButton anywhere without any extra wiring.
 */
export function AudioOutputStatus() {
  const { supported, device, status, notConnected } = useAudioOutputConnectivity();

  if (!supported) return null;

  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        Currently: <span className="font-semibold">{device?.label ?? 'System default'}</span>
        {device &&
          status === 'loaded' &&
          (notConnected ? (
            <X className="size-3.5 text-red-600 dark:text-red-400" />
          ) : (
            <Check className="size-3.5 text-green-600 dark:text-green-400" />
          ))}
      </p>

      {notConnected && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Selected device isn't connected — audio is going to the system default instead.
        </p>
      )}
    </div>
  );
}
