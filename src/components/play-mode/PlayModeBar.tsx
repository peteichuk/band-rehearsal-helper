import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pause,
  Play,
  Plus,
  X,
} from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { HoldButton } from '@/components/play-mode/HoldButton';
import { useBeatFlash } from '@/components/metronome/useBeatFlash';
import { useMetronomeControl } from '@/lib/metronomeControl';
import type { Song } from '@/types/song';

/** The bar tucks itself away again after this long without being touched. */
const AUTO_HIDE_MS = 6000;

/** Taps on these never toggle the bar — they have their own job (chord diagrams, links, controls…). */
const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [data-play-mode-bar]';

export interface PlayModeAutoScroll {
  enabled: boolean;
  level: number;
  maxLevel: number;
  toggle: () => void;
  faster: () => void;
  slower: () => void;
}

interface PlayModeBarProps {
  songName: string;
  /** 1-based position within the active prev/next list, with the list's length — null when it isn't part of one. */
  position: { index: number; total: number } | null;
  prev: Song | null;
  next: Song | null;
  /** What the prev/next buttons show — the title, with its setlist number when there is one ("№3 Title"). */
  prevLabel?: string | null;
  nextLabel?: string | null;
  onNavigate: (song: Song) => void;
  autoScroll: PlayModeAutoScroll;
  onExit: () => void;
}

/**
 * Play mode's bottom controls: big prev/next (hold to confirm), a big
 * metronome play/pause, and auto-scroll. Shown when Play mode starts, then hidden so the lyrics get
 * the whole screen — a tap on the song brings it back up, a tap again (or a few
 * seconds of nothing) puts it away.
 */
export function PlayModeBar({
  songName,
  position,
  prev,
  next,
  prevLabel,
  nextLabel,
  onNavigate,
  autoScroll,
  onExit,
}: PlayModeBarProps) {
  const { t } = useTranslation();
  const metronome = useMetronomeControl();
  // Open on entering Play mode (the bar only mounts then), so the metronome,
  // auto-scroll and its speed can be set up right away; it tucks itself away
  // after AUTO_HIDE_MS like any other time it's shown.
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);
  const flashRef = useRef<HTMLSpanElement>(null);

  // The Play button pulses with the beat, same as the metronome modal's one.
  useBeatFlash(flashRef, true, metronome?.currentBeat ?? null, metronome?.accentPattern ?? []);

  const scheduleHide = () => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  };

  // Tap anywhere on the song (not on a control) to toggle the bar.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || target.closest(INTERACTIVE_SELECTOR)) return;
      // A click that ends a text selection isn't a "tap".
      if (window.getSelection()?.toString()) return;
      setVisible(value => !value);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (visible) scheduleHide();
    else if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, [visible]);

  const isPlaying = metronome?.isPlaying ?? false;
  // Can't be started: no tempo of its own, and not already running.
  const noOwnTempo = metronome !== null && !metronome.hasOwnTempo && !isPlaying;

  return (
    <div
      data-play-mode-bar
      // Any touch on the bar itself keeps it open a bit longer.
      onPointerDown={() => visible && scheduleHide()}
      aria-hidden={!visible}
      className={cn(
        'print:hidden fixed inset-x-0 bottom-0 z-50 select-none border-t border-border bg-background/95 backdrop-blur',
        'px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.15)]',
        'transition-transform duration-200 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      )}
    >
      <div className="flex items-center gap-2 pb-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onExit}
          title={t('Exit play mode')}
        >
          <X />
          <span className="sr-only">{t('Exit play mode')}</span>
        </Button>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{songName}</p>
          {position && (
            <p className="text-xs text-muted-foreground">
              {position.index} / {position.total}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {autoScroll.enabled && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={autoScroll.level <= 1}
                onClick={autoScroll.slower}
                title={t('Slower')}
              >
                <Minus />
                <span className="sr-only">{t('Slower')}</span>
              </Button>
              <span className="w-5 text-center text-sm font-semibold tabular-nums">
                {autoScroll.level}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={autoScroll.level >= autoScroll.maxLevel}
                onClick={autoScroll.faster}
                title={t('Faster')}
              >
                <Plus />
                <span className="sr-only">{t('Faster')}</span>
              </Button>
            </>
          )}
          {/* Two-line caption ("Auto" / "scroll") — the hyphen in the English
              source becomes the line break; other languages just wrap. Only
              while off: once running, the speed controls take its place. */}
          {!autoScroll.enabled && (
            <span
              aria-hidden="true"
              className="ml-1 max-w-[4.5rem] whitespace-pre-line text-center text-xs leading-tight text-muted-foreground"
            >
              {t('Auto-scroll').replace('-', '\n')}
            </span>
          )}
          <Button
            type="button"
            size="icon"
            variant={autoScroll.enabled ? 'default' : 'outline'}
            aria-pressed={autoScroll.enabled}
            onClick={autoScroll.toggle}
            title={t('Auto-scroll')}
          >
            <ArrowDownToLine />
            <span className="sr-only">{t('Auto-scroll')}</span>
          </Button>
        </div>
      </div>

      {/* Prev / Play / Next. With no neighbour on a side, that button stays
          but is disabled (like the regular prev/next row), so Play never
          shifts around. */}
      <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-2">
        <NavButton
          direction="prev"
          song={prev}
          label={prevLabel ?? prev?.Name ?? null}
          title={t('Hold to go to the previous song')}
          onNavigate={onNavigate}
        />

        <Button
          type="button"
          onClick={() => metronome?.toggle()}
          // No tempo of its own → the metronome would click at the default BPM, so
          // it can't be started from here (it can still be stopped if it's running).
          disabled={!metronome || noOwnTempo}
          className={cn(
            'relative min-h-20 h-auto flex-col gap-1 overflow-hidden',
            noOwnTempo
              ? // The same orange, just washed out (and not faded further by the
                // disabled style — the red dash has to stay readable).
                'bg-orange-200 text-orange-700/60 disabled:opacity-100 dark:bg-orange-950 dark:text-orange-300/50'
              : 'bg-orange-600 text-white hover:bg-orange-700',
            isPlaying && 'ring-2 ring-orange-300 dark:ring-orange-400'
          )}
        >
          <span
            ref={flashRef}
            aria-hidden="true"
            style={{ boxShadow: 'inset 0 0 20px 4px #fff' }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
          />
          {isPlaying ? <Pause className="size-9" /> : <Play className="size-9" />}
          {metronome && (
            <span className={cn('text-xs tabular-nums', !noOwnTempo && 'opacity-90')}>
              {/* No tempo of its own: a red dash instead of the default BPM. */}
              {metronome.hasOwnTempo ? (
                metronome.bpm
              ) : (
                <span className="text-base font-bold leading-none text-red-600 dark:text-red-400">
                  -
                </span>
              )}{' '}
              BPM · {metronome.timeSignatureLabel}
            </span>
          )}
          <span className="sr-only">{isPlaying ? t('Pause') : t('Play')}</span>
        </Button>

        <NavButton
          direction="next"
          song={next}
          label={nextLabel ?? next?.Name ?? null}
          title={t('Hold to go to the next song')}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

function NavButton({
  direction,
  song,
  label,
  title,
  onNavigate,
}: {
  direction: 'prev' | 'next';
  song: Song | null;
  label: string | null;
  title: string;
  onNavigate: (song: Song) => void;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <HoldButton
      disabled={!song}
      onComplete={() => song && onNavigate(song)}
      title={title}
      className={cn(
        'min-h-20 flex-col gap-1 disabled:opacity-100',
        song
          ? 'bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-700'
          : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
      )}
    >
      <Icon className="size-7 shrink-0" />
      <span className="line-clamp-2 max-w-full whitespace-normal text-center text-xs leading-tight">
        {song ? label : '...'}
      </span>
    </HoldButton>
  );
}
