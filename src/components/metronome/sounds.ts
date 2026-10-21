export type ClickSoundId = 'beep' | 'woodblock' | 'cowbell' | 'clave';

/** The 3 audible beat strengths — a muted beat never reaches `play` at all. */
export type ClickStrength = 'normal' | 'medium' | 'accent';

export interface ClickSound {
  id: ClickSoundId;
  label: string;
  /** Schedules the click at `time` (AudioContext clock) on its own nodes. */
  play: (audioCtx: AudioContext, time: number, strength: ClickStrength) => void;
}

/** 0 at 'normal', 1 at 'accent', halfway at 'medium' — every sound below interpolates its pitch/gain between its own normal and accent values off this. */
const STRENGTH_T: Record<ClickStrength, number> = { normal: 0, medium: 0.5, accent: 1 };

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function createNoiseBuffer(audioCtx: AudioContext, durationSec: number) {
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * durationSec));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Plain digital beep — pitch climbs from normal to accent, quick decay. */
function playBeep(audioCtx: AudioContext, time: number, strength: ClickStrength) {
  const duration = 0.03;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.frequency.value = lerp(800, 1000, STRENGTH_T[strength]);
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

/** Filtered noise burst — the classic wooden metronome "knock". */
function playWoodblock(audioCtx: AudioContext, time: number, strength: ClickStrength) {
  const duration = 0.05;
  const t = STRENGTH_T[strength];
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer(audioCtx, duration);
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = lerp(1600, 2200, t);
  bandpass.Q.value = 6;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(lerp(0.6, 0.9, t), time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start(time);
  noise.stop(time + duration);
}

/** TR-808-style cowbell — two detuned square oscillators through a resonant bandpass. */
function playCowbell(audioCtx: AudioContext, time: number, strength: ClickStrength) {
  const duration = 0.3;
  const t = STRENGTH_T[strength];
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(lerp(0.35, 0.5, t), time);
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
    oscillator.frequency.value = freq * lerp(1, 1.1, t);
    oscillator.connect(bandpass);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
}

/** Short, bright tonal burst — the classic wooden clave "tock". */
function playClave(audioCtx: AudioContext, time: number, strength: ClickStrength) {
  const duration = 0.015;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = lerp(2500, 2800, STRENGTH_T[strength]);
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
  getClickSound(id).play(audioCtx, audioCtx.currentTime + 0.02, 'normal');
  setTimeout(() => audioCtx.close(), 500);
}
