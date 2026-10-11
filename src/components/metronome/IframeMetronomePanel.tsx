import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface IframeMetronomePanelProps {
  bpm: number;
}

/** The original guitarapp.com embed, kept as a switchable alternative to the local engine. */
export function IframeMetronomePanel({ bpm }: IframeMetronomePanelProps) {
  const isDark = useDarkMode();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (src !== null) return;
    const theme = isDark ? 'dark' : 'light';
    setSrc(
      `https://guitarapp.com/metronome.html?tempo=${bpm}&timeSignature=2&pattern=0&theme=${theme}&embed=true`
    );
  }, [src, bpm, isDark]);

  if (src === null) return null;

  return <iframe src={src} title="Metronome" className="w-full h-[500px] border-0 rounded" />;
}
