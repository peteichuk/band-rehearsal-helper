import { useEffect, useState } from 'react';
import {
  deviceNoLongerMatches,
  enumerateAudioOutputsAfterChange,
  isAudioOutputSelectionSupported,
  listAudioOutputDevices,
} from '@/lib/audioOutputDevice';
import { useAudioOutputDevice } from '@/hooks/useAudioOutputDevice';

/**
 * The saved output device plus whether it's actually connected right now —
 * shared by AudioOutputButton's indicator dot and AudioOutputStatus's text,
 * so both reflect the same live state without duplicating the polling.
 */
export function useAudioOutputConnectivity() {
  const supported = isAudioOutputSelectionSupported();
  const device = useAudioOutputDevice();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!supported) return;

    const refresh = () => {
      listAudioOutputDevices()
        .then(list => {
          setDevices(list);
          setStatus('loaded');
        })
        .catch(() => setStatus('error'));
    };
    refresh();

    // Delayed on purpose: enumerateDevices() can briefly return a stale
    // list right as devicechange fires, before the OS has actually
    // finished switching its default.
    const refreshAfterChange = () => {
      enumerateAudioOutputsAfterChange()
        .then(list => {
          setDevices(list);
          setStatus('loaded');
        })
        .catch(() => setStatus('error'));
    };
    navigator.mediaDevices.addEventListener('devicechange', refreshAfterChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshAfterChange);
  }, [supported]);

  const notConnected =
    device != null && status === 'loaded' && deviceNoLongerMatches(device, devices);

  return { supported, device, status, notConnected, connected: device == null || !notConnected };
}
