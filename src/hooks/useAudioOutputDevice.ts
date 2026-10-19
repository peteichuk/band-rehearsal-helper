import { useSyncExternalStore } from 'react';
import { subscribeAudioOutputDevice, getAudioOutputDeviceSnapshot } from '@/lib/audioOutputDevice';

/** The currently selected output device (or null for the system default) — reactive across every component that reads it. */
export function useAudioOutputDevice() {
  return useSyncExternalStore(subscribeAudioOutputDevice, getAudioOutputDeviceSnapshot);
}
