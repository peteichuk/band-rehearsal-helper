import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Save } from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useAudioOutputDevice } from '@/hooks/useAudioOutputDevice';
import { useSyncedMetronomePreset } from '@/hooks/useSyncedMetronomePreset';
import { useMetronomeEngine } from '@/components/metronome/useMetronomeEngine';
import { AudioOutputButton } from '@/components/shared/AudioOutputButton';
import { Button } from '@/components/ui/button';
import {
  CUSTOM_PATTERN_ID,
  cycleBeatLevel,
  getAccentPattern,
  getTimeSignature,
  resolveAccentPatternId,
  type BeatLevel,
} from '@/components/metronome/timeSignatures';
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
import { BeatAccentEditor } from '@/components/metronome/BeatAccentEditor';
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
  const { t } = useTranslation();
  // Picks up an external write to this song's preset — a Settings →
  // Backup reset/Import, editing the same song's preset from Settings'
  // own list, etc. — even while this panel is already mounted and just
  // sitting hidden behind a closed modal (see MetronomeModal's forceMount
  // comment). `stopIfPlaying` is assigned below once useMetronomeEngine
  // actually exists — see its own comment for why the indirection.
  const stopIfPlayingRef = useRef<() => void>(() => {});
  const { synced, updateSynced, preset, save, isDirty, reset } = useSyncedMetronomePreset({
    songName,
    sheetDefaults: { bpm: initialBpm, timeSignatureId: initialTimeSignatureId },
    onExternalChange: () => stopIfPlayingRef.current(),
  });
  const { bpm, timeSignatureId, customAccentPatterns: customPatterns } = synced;
  const timeSignature = getTimeSignature(timeSignatureId);
  // resolveAccentPatternId falls back to this meter's own default whenever
  // synced.accentPatternId isn't one of this meter's own pattern ids (e.g.
  // the song's saved pattern was for a different meter).
  const accentPatternId = resolveAccentPatternId(timeSignature, synced.accentPatternId);
  const isCustom = accentPatternId === CUSTOM_PATTERN_ID;
  const { beatsPerBar, beatUnitScale } = timeSignature;

  // A global rolling default (same spirit as useGlobalDisplayDefaults behind
  // useSongDisplayConfig) — backs any song that's never had its own sound
  // picked, and keeps tracking whatever was last chosen anywhere.
  const [globalDefaultSoundId, setGlobalDefaultSoundId] = useLocalStorageState<ClickSoundId>(
    'metronome-sound',
    DEFAULT_CLICK_SOUND_ID
  );
  const [soundId, setSoundIdState] = useState<ClickSoundId>(
    preset?.soundId ?? globalDefaultSoundId
  );
  const audioOutputDevice = useAudioOutputDevice();

  const handleBpmChange = (next: number) => updateSynced({ bpm: next });

  const handleTimeSignatureChange = (id: string) => updateSynced({ timeSignatureId: id });

  const handleAccentPatternChange = (id: string) => {
    // Switching into Custom for a meter that's never had one seeds it from
    // whatever pattern was just showing, instead of starting blank.
    if (id === CUSTOM_PATTERN_ID && !customPatterns[timeSignatureId]) {
      const seed = getAccentPattern(timeSignature, accentPatternId).accents;
      updateSynced({
        accentPatternId: id,
        customAccentPatterns: { ...customPatterns, [timeSignatureId]: seed },
      });
      return;
    }
    updateSynced({ accentPatternId: id });
  };

  const handleBeatLevelChange = (beatIndex: number) => {
    const current = customPatterns[timeSignatureId] ?? Array(beatsPerBar).fill('normal');
    const next = [...current];
    next[beatIndex] = cycleBeatLevel(next[beatIndex] ?? 'normal');
    updateSynced({ customAccentPatterns: { ...customPatterns, [timeSignatureId]: next } });
  };

  const accentPattern = isCustom
    ? (customPatterns[timeSignatureId] ?? (Array(beatsPerBar).fill('normal') as BeatLevel[]))
    : getAccentPattern(timeSignature, accentPatternId).accents;
  const { isPlaying, currentBeat, toggle, stop, restartForDeviceChange } = useMetronomeEngine({
    bpm,
    beatsPerBar,
    beatUnitScale,
    accentPattern,
    soundId,
    audioOutputDevice,
  });

  // useMetronomeEngine now exists, so stopIfPlayingRef (passed to
  // useSyncedMetronomePreset above, before this was available) can finally
  // do its job for the rest of this panel's life.
  stopIfPlayingRef.current = () => {
    if (isPlaying) stop();
  };

  // Same idea as useSyncedMetronomePreset's own sync effect, just for
  // soundId specifically — it isn't part of SyncedPresetFields (no per-song
  // sheet default to fall back to, see the MetronomePreset interface
  // comment), so it's kept in step separately rather than folded into that
  // hook. Also covers the preset being cleared entirely (e.g. a Settings →
  // Backup reset) — `preset?.soundId` already falls back to the global
  // default correctly in that case, no separate null-check needed.
  useEffect(() => {
    const nextSoundId = preset?.soundId ?? globalDefaultSoundId;
    if (nextSoundId === soundId) return;
    setSoundIdState(nextSoundId);
    if (isPlaying) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

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
    setSoundIdState(id);
    // Outside a song there's no Save button to commit to (see below), so
    // this is the only chance to remember the choice — persist it right
    // away. Inside a song, it waits for an explicit Save like everything
    // else here.
    if (!songName) setGlobalDefaultSoundId(id);
    if (!isPlaying) previewClickSound(id);
  };

  // Combines this hook's own dirty check (bpm/time signature/accent) with
  // soundId, which it doesn't track — true whenever there's something a
  // Save button should actually write.
  const hasUnsavedChanges =
    songName !== null && (isDirty || soundId !== (preset?.soundId ?? globalDefaultSoundId));

  const handleSave = () => {
    save({ soundId });
    setGlobalDefaultSoundId(soundId);
  };

  // True whenever there's actually something a Reset would clear — a saved
  // preset for this song, or local edits that drifted from the song's own
  // sheet defaults without ever being saved.
  const isAtSheetDefault =
    bpm === initialBpm &&
    timeSignatureId === initialTimeSignatureId &&
    synced.accentPatternId === undefined &&
    Object.keys(customPatterns).length === 0 &&
    soundId === globalDefaultSoundId;
  const canReset = songName !== null && (preset !== null || !isAtSheetDefault);

  const handleReset = () => {
    reset();
    setSoundIdState(globalDefaultSoundId);
    if (isPlaying) stop();
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
      <div className="flex w-full items-center justify-center gap-2">
        <TimeSignatureSelect value={timeSignatureId} onChange={handleTimeSignatureChange} />
        <AccentPatternSelect
          patterns={timeSignature.accentPatterns}
          value={accentPatternId}
          onChange={handleAccentPatternChange}
        />
        <SoundSelect value={soundId} onChange={handleSoundChange} />
      </div>

      <TempoControl bpm={bpm} onChange={handleBpmChange} />

      {isCustom ? (
        <BeatAccentEditor
          beatsPerBar={beatsPerBar}
          currentBeat={currentBeat}
          levels={accentPattern}
          onLevelChange={handleBeatLevelChange}
        />
      ) : (
        <BeatIndicator
          beatsPerBar={beatsPerBar}
          currentBeat={currentBeat}
          accentPattern={accentPattern}
        />
      )}

      <div className="flex items-center justify-center gap-3">
        <TapTempoButton onChange={handleBpmChange} />
        <PlayPauseButton isPlaying={isPlaying} onToggle={toggle} />
        <BeatCounter currentBeat={currentBeat} beatsPerBar={beatsPerBar} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <AudioOutputButton />
        {songName && (
          <>
            <Button type="button" variant="outline" disabled={!canReset} onClick={handleReset}>
              <RotateCcw data-icon="inline-start" />
              {t('Reset')}
            </Button>
            <Button type="button" disabled={!hasUnsavedChanges} onClick={handleSave}>
              <Save data-icon="inline-start" />
              {t('Save')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
