const STORAGE_KEY = 'audioOutputDevice';

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

type Listener = () => void;

function loadFromStorage(): AudioOutputDevice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AudioOutputDevice) : null;
  } catch {
    return null;
  }
}

let device: AudioOutputDevice | null = loadFromStorage();
const listeners = new Set<Listener>();

function persist() {
  try {
    if (device) localStorage.setItem(STORAGE_KEY, JSON.stringify(device));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore (e.g. storage disabled/full)
  }
  listeners.forEach(listener => listener());
}

/**
 * `AudioContext.setSinkId()` (used in useMetronomeEngine to actually route
 * sound) is Chromium-only (Chrome/Edge/Opera, desktop and Android) — not
 * Firefox or Safari/iOS. `MediaDevices.selectAudioOutput()` is a DIFFERENT,
 * non-overlapping API that only Firefox has, and doesn't pair with
 * AudioContext at all — not used here, since it'd never apply on a browser
 * that can also actually set the sink.
 */
export function isAudioOutputSelectionSupported(): boolean {
  return (
    typeof AudioContext !== 'undefined' &&
    typeof AudioContext.prototype.setSinkId === 'function' &&
    typeof navigator.mediaDevices?.enumerateDevices === 'function'
  );
}

function filterAudioOutputs(list: MediaDeviceInfo[]): MediaDeviceInfo[] {
  return list.filter(d => d.kind === 'audiooutput');
}

/**
 * Lists output devices. Device labels come back blank until the page has
 * been granted *some* media permission at least once — Chrome ties output
 * device names to that, even though this never records anything. If labels
 * are missing, this prompts for mic access purely to unlock them, then
 * immediately stops the resulting track.
 */
export async function listAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
  let devices = await navigator.mediaDevices.enumerateDevices();
  const needsLabels = devices.some(d => d.kind === 'audiooutput' && !d.label);
  if (needsLabels) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      devices = await navigator.mediaDevices.enumerateDevices();
    } catch {
      // Permission denied — fall back to whatever (possibly label-less)
      // devices the first enumerateDevices() call already returned.
    }
  }
  return filterAudioOutputs(devices);
}

/**
 * Same as `enumerateDevices()` filtered to outputs, but after a short
 * delay — Chrome can briefly return a stale list right as a `devicechange`
 * event fires, before the OS has actually finished switching its default,
 * which otherwise shows up as "works every other time".
 */
export async function enumerateAudioOutputsAfterChange(delayMs = 400): Promise<MediaDeviceInfo[]> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  const list = await navigator.mediaDevices.enumerateDevices();
  return filterAudioOutputs(list);
}

/**
 * True if `saved` no longer matches reality: either its deviceId is gone
 * entirely, or — on macOS in particular — Chrome keeps a pseudo-device with
 * a stable deviceId of "default" whose *label* just describes whatever the
 * system default currently is (e.g. "Default - External Headphones"
 * becomes "Default - MacBook Pro Speakers" once unplugged). Same id,
 * different real device, so the label has to be compared too.
 */
export function deviceNoLongerMatches(saved: AudioOutputDevice, list: MediaDeviceInfo[]): boolean {
  const match = list.find(d => d.deviceId === saved.deviceId);
  if (!match) return true;
  return Boolean(match.label) && match.label !== saved.label;
}

export function setAudioOutputDevice(next: AudioOutputDevice | null) {
  device = next;
  persist();
}

export function subscribeAudioOutputDevice(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAudioOutputDeviceSnapshot(): AudioOutputDevice | null {
  return device;
}
