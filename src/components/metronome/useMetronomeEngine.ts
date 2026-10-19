import { useEffect, useRef, useState } from 'react';
import { getClickSound, type ClickSoundId } from '@/components/metronome/sounds';
import {
  deviceNoLongerMatches,
  enumerateAudioOutputsAfterChange,
  type AudioOutputDevice,
} from '@/lib/audioOutputDevice';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;

interface MetronomeEngineOptions {
  bpm: number;
  beatsPerBar: number;
  /** See TimeSignature.beatUnitScale — 1 for /4 meters, 2 for /8 meters. */
  beatUnitScale: number;
  /** One entry per beat (see TimeSignature.AccentPattern) — true where that beat is accented. */
  accentPattern: boolean[];
  soundId: ClickSoundId;
  /** See useAudioOutputDevice — null (the default) just leaves the AudioContext on the system default output. */
  audioOutputDevice: AudioOutputDevice | null;
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
  beatUnitScale,
  accentPattern,
  soundId,
  audioOutputDevice,
}: MetronomeEngineOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatNumberRef = useRef(0);
  const scheduledNotesRef = useRef<ScheduledNote[]>([]);
  // Whether the current AudioContext is actually routed to `audioOutputDevice`
  // — false while a requested device was unavailable at the time (so we're
  // on the fallback default instead), used to redirect once it comes back.
  const sinkAppliedRef = useRef(true);

  // Kept fresh so the scheduler always reads the latest values without
  // needing to restart playback when they change mid-beat.
  const paramsRef = useRef({ bpm, beatsPerBar, beatUnitScale, accentPattern, soundId });
  useEffect(() => {
    paramsRef.current = { bpm, beatsPerBar, beatUnitScale, accentPattern, soundId };
  }, [bpm, beatsPerBar, beatUnitScale, accentPattern, soundId]);

  const scheduleClick = (audioCtx: AudioContext, beatNumber: number, time: number) => {
    const isAccent = paramsRef.current.accentPattern[beatNumber] ?? false;
    getClickSound(paramsRef.current.soundId).play(audioCtx, time, isAccent);
    scheduledNotesRef.current.push({ beatNumber, time });
  };

  const advanceNote = () => {
    const secondsPerBeat = 60 / paramsRef.current.bpm / paramsRef.current.beatUnitScale;
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

  /** Tears down the running AudioContext/timers without touching `isPlaying` — shared by stop() and a device-change restart. */
  const teardownPlayback = () => {
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
  };

  /** Creates a fresh AudioContext and kicks off scheduling — shared by start() and a device-change restart. */
  const beginPlayback = () => {
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    if (audioOutputDevice && audioCtx.setSinkId) {
      sinkAppliedRef.current = false;
      audioCtx
        .setSinkId(audioOutputDevice.deviceId)
        .then(() => navigator.mediaDevices.enumerateDevices())
        .then(list => {
          // setSinkId resolving isn't proof it's actually on the intended
          // *physical* device: on macOS, a deviceId of "default" always
          // resolves successfully, no matter which device it currently
          // points to — so this re-checks the live label too (same
          // deviceNoLongerMatches logic the devicechange watcher uses), or
          // a restart later on reconnect would wrongly no-op, thinking
          // this one already "succeeded".
          const outputs = list.filter(d => d.kind === 'audiooutput');
          sinkAppliedRef.current = !deviceNoLongerMatches(audioOutputDevice, outputs);
        })
        .catch(() => {
          // Rejected outright (e.g. the saved device got unplugged/removed)
          // — playback just stays on the system default output, never
          // blocks or mutes the metronome. sinkAppliedRef staying false
          // lets the devicechange watcher below redirect once it's back.
        });
    } else {
      sinkAppliedRef.current = true;
    }
    beatNumberRef.current = 0;
    nextNoteTimeRef.current = audioCtx.currentTime + 0.05;
    scheduler();
    rafRef.current = requestAnimationFrame(updateCurrentBeatDisplay);
  };

  const stop = () => {
    teardownPlayback();
    setIsPlaying(false);
    setCurrentBeat(null);
  };

  const start = () => {
    if (isPlaying) return;
    beginPlayback();
    setIsPlaying(true);
  };

  /**
   * Re-applies the current `audioOutputDevice` to a fresh AudioContext
   * without stopping the UI's "playing" state — e.g. after confirming a
   * newly-picked output device while the metronome is already running,
   * since setSinkId only gets applied once, at the AudioContext a given
   * play started with.
   */
  const restartForDeviceChange = () => {
    if (!isPlaying) return;
    teardownPlayback();
    beginPlayback();
  };

  const toggle = () => (isPlaying ? stop() : start());

  useEffect(() => stop, []);

  // Reacts to the requested device coming and going while already playing:
  // gone → stop rather than let the click silently fall back to whatever's
  // now the system default (the user may not even be near that speaker);
  // back again (reconnected after having been on the fallback) → redirect
  // to it instead of silently staying on the fallback forever.
  useEffect(() => {
    if (!isPlaying || !audioOutputDevice) return;
    const checkStillConnected = () => {
      // Delayed on purpose: enumerateDevices() can briefly return a stale
      // list right as devicechange fires, before the OS has actually
      // finished switching its default — without this, a reconnect looked
      // like it "worked every other time".
      enumerateAudioOutputsAfterChange().then(outputs => {
        if (deviceNoLongerMatches(audioOutputDevice, outputs)) {
          stop();
        } else if (!sinkAppliedRef.current) {
          restartForDeviceChange();
        }
      });
    };
    navigator.mediaDevices.addEventListener('devicechange', checkStillConnected);
    return () => navigator.mediaDevices.removeEventListener('devicechange', checkStillConnected);
    // `stop`/`restartForDeviceChange` are intentionally omitted — stable in
    // behavior (refs/setState only), re-subscribing every render would be
    // pointless churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, audioOutputDevice]);

  return { isPlaying, currentBeat, start, stop, toggle, restartForDeviceChange };
}
