import { useState } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useMetronomeEngine } from '@/components/metronome/useMetronomeEngine';
import { getTimeSignature } from '@/components/metronome/timeSignatures';
import {
  DEFAULT_CLICK_SOUND_ID,
  previewClickSound,
  type ClickSoundId,
} from '@/components/metronome/sounds';
import { TempoControl } from '@/components/metronome/TempoControl';
import { TapTempoButton } from '@/components/metronome/TapTempoButton';
import { TimeSignatureSelect } from '@/components/metronome/TimeSignatureSelect';
import { SoundSelect } from '@/components/metronome/SoundSelect';
import { AccentToggle } from '@/components/metronome/AccentToggle';
import { BeatIndicator } from '@/components/metronome/BeatIndicator';
import { PlayPauseButton } from '@/components/metronome/PlayPauseButton';

interface LocalMetronomePanelProps {
  bpm: number;
  /** Seeded from the song's `TimeSignature` sheet column — not persisted, same as `bpm`. */
  timeSignatureId: string;
}

export function LocalMetronomePanel({
  bpm: initialBpm,
  timeSignatureId: initialTimeSignatureId,
}: LocalMetronomePanelProps) {
  const [bpm, setBpm] = useState(initialBpm);
  const [timeSignatureId, setTimeSignatureId] = useState(initialTimeSignatureId);
  const [accentFirstBeat, setAccentFirstBeat] = useLocalStorageState(
    'metronome-accent-first-beat',
    true
  );
  const [soundId, setSoundId] = useLocalStorageState<ClickSoundId>(
    'metronome-sound',
    DEFAULT_CLICK_SOUND_ID
  );

  const { beatsPerBar } = getTimeSignature(timeSignatureId);
  const { isPlaying, currentBeat, toggle } = useMetronomeEngine({
    bpm,
    beatsPerBar,
    accentFirstBeat,
    soundId,
  });

  const handleSoundChange = (id: ClickSoundId) => {
    setSoundId(id);
    if (!isPlaying) previewClickSound(id);
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <TempoControl bpm={bpm} onChange={setBpm} />

      <BeatIndicator
        beatsPerBar={beatsPerBar}
        currentBeat={currentBeat}
        accentFirstBeat={accentFirstBeat}
      />

      <PlayPauseButton isPlaying={isPlaying} onToggle={toggle} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <TapTempoButton onChange={setBpm} />
        <TimeSignatureSelect value={timeSignatureId} onChange={setTimeSignatureId} />
        <SoundSelect value={soundId} onChange={handleSoundChange} />
        <AccentToggle accentFirstBeat={accentFirstBeat} onChange={setAccentFirstBeat} />
      </div>
    </div>
  );
}
