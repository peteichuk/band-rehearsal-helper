import { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useAudioOutputDevice } from '@/hooks/useAudioOutputDevice';
import { useMetronomeEngine } from '@/components/metronome/useMetronomeEngine';
import { AudioOutputButton } from '@/components/shared/AudioOutputButton';
import {
  getAccentPattern,
  getTimeSignature,
  resolveAccentPatternId,
} from '@/components/metronome/timeSignatures';
import { getMetronomePreset, setMetronomePreset } from '@/lib/metronomePresets';
import {
  DEFAULT_CLICK_SOUND_ID,
  previewClickSound,
  type ClickSoundId,
} from '@/components/metronome/sounds';
import { TempoControl } from '@/components/metronome/TempoControl';
import { TapTempoButton } from '@/components/metronome/TapTempoButton';
import { TimeSignatureSelect } from '@/components/metronome/TimeSignatureSelect';
import { SoundSelect } from '@/components/metronome/SoundSelect';
import { AccentPatternSelect } from '@/components/metronome/AccentPatternSelect';
import { BeatIndicator } from '@/components/metronome/BeatIndicator';
import { PlayPauseButton } from '@/components/metronome/PlayPauseButton';
import { BeatCounter } from '@/components/metronome/BeatCounter';

interface LocalMetronomePanelProps {
  bpm: number;
  /** Seeded from the song's `TimeSignature` sheet column — overridden by that song's saved preset, if any. */
  timeSignatureId: string;
  /** Identifies the song for its saved metronome preset (tempo/time signature/accent) — null skips persistence. */
  songName: string | null;
  /** Mirrors the engine's play state up to callers (e.g. to animate a header button). */
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function LocalMetronomePanel({
  bpm: initialBpm,
  timeSignatureId: initialTimeSignatureId,
  songName,
  onPlayingChange,
}: LocalMetronomePanelProps) {
  const preset = songName ? getMetronomePreset(songName) : null;
  const [bpm, setBpm] = useState(preset?.bpm ?? initialBpm);
  const [timeSignatureId, setTimeSignatureId] = useState(
    preset?.timeSignatureId ?? initialTimeSignatureId
  );
  const timeSignature = getTimeSignature(timeSignatureId);
  // The explicit choice (if any) made this session or restored from the
  // song's preset — resolveAccentPatternId below falls back to this meter's
  // own default whenever it isn't one of this meter's own pattern ids
  // (e.g. the song's saved pattern was for a different meter).
  const [storedAccentPatternId, setStoredAccentPatternId] = useState(preset?.accentPatternId);
  const accentPatternId = resolveAccentPatternId(timeSignature, storedAccentPatternId);
  const [soundId, setSoundId] = useLocalStorageState<ClickSoundId>(
    'metronome-sound',
    DEFAULT_CLICK_SOUND_ID
  );
  const audioOutputDevice = useAudioOutputDevice();

  const handleBpmChange = (next: number) => {
    setBpm(next);
    if (songName) setMetronomePreset(songName, { bpm: next });
  };

  const handleTimeSignatureChange = (id: string) => {
    setTimeSignatureId(id);
    if (songName) setMetronomePreset(songName, { timeSignatureId: id });
  };

  const handleAccentPatternChange = (id: string) => {
    setStoredAccentPatternId(id);
    if (songName) setMetronomePreset(songName, { accentPatternId: id });
  };

  const { beatsPerBar, beatUnitScale } = timeSignature;
  const accentPattern = getAccentPattern(timeSignature, accentPatternId).accents;
  const { isPlaying, currentBeat, toggle, restartForDeviceChange } = useMetronomeEngine({
    bpm,
    beatsPerBar,
    beatUnitScale,
    accentPattern,
    soundId,
    audioOutputDevice,
  });

  // Confirming a new output device (see AudioOutputButton/Dialog) only
  // takes effect on the next AudioContext by default — if the metronome is
  // already running, redirect it immediately instead of leaving the sound
  // on the device that was picked when play was last pressed.
  const prevAudioDeviceIdRef = useRef(audioOutputDevice?.deviceId ?? null);
  useEffect(() => {
    const nextId = audioOutputDevice?.deviceId ?? null;
    if (nextId !== prevAudioDeviceIdRef.current) {
      prevAudioDeviceIdRef.current = nextId;
      restartForDeviceChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOutputDevice]);

  const handleSoundChange = (id: ClickSoundId) => {
    setSoundId(id);
    if (!isPlaying) previewClickSound(id);
  };

  useEffect(() => {
    onPlayingChange?.(isPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Covers engine switches and song changes: this panel unmounts (key/branch
  // change) without `isPlaying` necessarily having flipped back to false first.
  useEffect(() => {
    return () => onPlayingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="flex w-full max-w-[220px] items-center justify-between gap-2">
        <TimeSignatureSelect value={timeSignatureId} onChange={handleTimeSignatureChange} />
        <AccentPatternSelect
          patterns={timeSignature.accentPatterns}
          value={accentPatternId}
          onChange={handleAccentPatternChange}
        />
      </div>

      <TempoControl bpm={bpm} onChange={handleBpmChange} />

      <BeatIndicator
        beatsPerBar={beatsPerBar}
        currentBeat={currentBeat}
        accentPattern={accentPattern}
      />

      <div className="relative flex items-center justify-center">
        <PlayPauseButton isPlaying={isPlaying} onToggle={toggle} />
        <div className="absolute left-full ml-3">
          <BeatCounter currentBeat={currentBeat} beatsPerBar={beatsPerBar} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <TapTempoButton onChange={handleBpmChange} />
        <SoundSelect value={soundId} onChange={handleSoundChange} />
        <AudioOutputButton />
      </div>
    </div>
  );
}
