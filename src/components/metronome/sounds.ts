export type ClickSoundId = 'beep' | 'woodblock' | 'cowbell' | 'clave';

export interface ClickSound {
  id: ClickSoundId;
  label: string;
  /** Schedules the click at `time` (AudioContext clock) on its own nodes. */
  play: (audioCtx: AudioContext, time: number, isAccent: boolean) => void;
}

function createNoiseBuffer(audioCtx: AudioContext, durationSec: number) {
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * durationSec));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Plain digital beep — two pitches (accent vs. normal), quick decay. */
function playBeep(audioCtx: AudioContext, time: number, isAccent: boolean) {
  const duration = 0.03;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.frequency.value = isAccent ? 1000 : 800;
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

/** Filtered noise burst — the classic wooden metronome "knock". */
function playWoodblock(audioCtx: AudioContext, time: number, isAccent: boolean) {
  const duration = 0.05;
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer(audioCtx, duration);
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = isAccent ? 2200 : 1600;
  bandpass.Q.value = 6;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(time);
  noise.stop(time + duration);
}

/** TR-808-style cowbell — two detuned square oscillators through a resonant bandpass. */
function playCowbell(audioCtx: AudioContext, time: number, isAccent: boolean) {
  const duration = 0.3;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(isAccent ? 0.5 : 0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 800;
  bandpass.Q.value = 1;
  bandpass.connect(gain);
  gain.connect(audioCtx.destination);
  for (const freq of [800, 540]) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = isAccent ? freq * 1.1 : freq;
    oscillator.connect(bandpass);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
}

/** Short, bright tonal burst — the classic wooden clave "tock". */
function playClave(audioCtx: AudioContext, time: number, isAccent: boolean) {
  const duration = 0.015;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = isAccent ? 2800 : 2500;
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

export const CLICK_SOUNDS: ClickSound[] = [
  { id: 'beep', label: 'Beep', play: playBeep },
  { id: 'woodblock', label: 'Woodblock', play: playWoodblock },
  { id: 'cowbell', label: 'Cowbell', play: playCowbell },
  { id: 'clave', label: 'Clave', play: playClave },
];

export const DEFAULT_CLICK_SOUND_ID: ClickSoundId = 'beep';

export function getClickSound(id: ClickSoundId): ClickSound {
  return CLICK_SOUNDS.find(sound => sound.id === id) ?? CLICK_SOUNDS[0];
}

/** Plays a one-off click on a scratch AudioContext, for auditioning a sound choice. */
export function previewClickSound(id: ClickSoundId) {
  const audioCtx = new AudioContext();
  getClickSound(id).play(audioCtx, audioCtx.currentTime + 0.02, false);
  setTimeout(() => audioCtx.close(), 500);
}
