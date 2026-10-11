import { useEffect, useRef, useState } from 'react';
import { getClickSound, type ClickSoundId } from '@/components/metronome/sounds';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;

interface MetronomeEngineOptions {
  bpm: number;
  beatsPerBar: number;
  accentFirstBeat: boolean;
  soundId: ClickSoundId;
}

interface ScheduledNote {
  beatNumber: number;
  time: number;
}

/**
 * Web Audio lookahead scheduler ("A Tale of Two Clocks" pattern): a plain
 * setInterval click drifts/jitters too much to keep time, so instead a timer
 * every `LOOKAHEAD_MS` schedules any click due within the next
 * `SCHEDULE_AHEAD_SEC`, using the AudioContext's own clock for the actual
 * sample-accurate timing.
 */
export function useMetronomeEngine({
  bpm,
  beatsPerBar,
  accentFirstBeat,
  soundId,
}: MetronomeEngineOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatNumberRef = useRef(0);
  const scheduledNotesRef = useRef<ScheduledNote[]>([]);

  // Kept fresh so the scheduler always reads the latest values without
  // needing to restart playback when they change mid-beat.
  const paramsRef = useRef({ bpm, beatsPerBar, accentFirstBeat, soundId });
  useEffect(() => {
    paramsRef.current = { bpm, beatsPerBar, accentFirstBeat, soundId };
  }, [bpm, beatsPerBar, accentFirstBeat, soundId]);

  const scheduleClick = (audioCtx: AudioContext, beatNumber: number, time: number) => {
    const isAccent = paramsRef.current.accentFirstBeat && beatNumber === 0;
    getClickSound(paramsRef.current.soundId).play(audioCtx, time, isAccent);
    scheduledNotesRef.current.push({ beatNumber, time });
  };

  const advanceNote = () => {
    const secondsPerBeat = 60 / paramsRef.current.bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    beatNumberRef.current = (beatNumberRef.current + 1) % paramsRef.current.beatsPerBar;
  };

  const scheduler = () => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    while (nextNoteTimeRef.current < audioCtx.currentTime + SCHEDULE_AHEAD_SEC) {
      scheduleClick(audioCtx, beatNumberRef.current, nextNoteTimeRef.current);
      advanceNote();
    }
    timerRef.current = window.setTimeout(scheduler, LOOKAHEAD_MS);
  };

  const updateCurrentBeatDisplay = () => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    const notes = scheduledNotesRef.current;
    while (notes.length > 0 && notes[0].time <= audioCtx.currentTime) {
      setCurrentBeat(notes[0].beatNumber);
      notes.shift();
    }
    rafRef.current = requestAnimationFrame(updateCurrentBeatDisplay);
  };

  const stop = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    scheduledNotesRef.current = [];
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
    setCurrentBeat(null);
  };

  const start = () => {
    if (isPlaying) return;
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    beatNumberRef.current = 0;
    nextNoteTimeRef.current = audioCtx.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
    rafRef.current = requestAnimationFrame(updateCurrentBeatDisplay);
  };

  const toggle = () => (isPlaying ? stop() : start());

  useEffect(() => stop, []);

  return { isPlaying, currentBeat, start, stop, toggle };
}
