import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  getAccentPatternIndex,
  getTimeSignature,
  resolveAccentPatternId,
} from '@/components/metronome/timeSignatures';
import { getMetronomePreset } from '@/lib/metronomePresets';

interface IframeMetronomePanelProps {
  bpm: number;
  /** Seeded from the song's `TimeSignature` sheet column — same resolved id as LocalMetronomePanel. */
  timeSignatureId: string;
  /** Identifies the song for its saved metronome preset (tempo/time signature/accent) — null skips the override. */
  songName: string | null;
}

/** The original guitarapp.com embed, kept as a switchable alternative to the local engine. */
export function IframeMetronomePanel({
  bpm,
  timeSignatureId,
  songName,
}: IframeMetronomePanelProps) {
  const isDark = useDarkMode();
  const [src, setSrc] = useState<string | null>(null);
  // Same per-song preset LocalMetronomePanel reads/writes, so switching
  // engines carries over whatever was last set for this song.
  const preset = songName ? getMetronomePreset(songName) : null;
  const effectiveBpm = preset?.bpm ?? bpm;
  const timeSignature = getTimeSignature(preset?.timeSignatureId ?? timeSignatureId);
  const accentPatternId = resolveAccentPatternId(timeSignature, preset?.accentPatternId);
  const pattern = getAccentPatternIndex(timeSignature, accentPatternId);

  useEffect(() => {
    if (src !== null) return;
    const theme = isDark ? 'dark' : 'light';
    setSrc(
      `https://guitarapp.com/metronome.html?tempo=${effectiveBpm}&timeSignature=${timeSignature.guitarappValue}&pattern=${pattern}&theme=${theme}&embed=true`
    );
  }, [src, effectiveBpm, timeSignature.guitarappValue, pattern, isDark]);

  if (src === null) return null;

  return <iframe src={src} title="Metronome" className="w-full h-[500px] border-0 rounded" />;
}
