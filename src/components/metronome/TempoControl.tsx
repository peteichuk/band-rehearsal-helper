import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_BPM = 20;
const MAX_BPM = 280;
const RADIUS = 80;
const CENTER = 100;
const STROKE_WIDTH = 10;
const HANDLE_RADIUS = 10;
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 110;

interface TempoControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Maps a 0..1 position along the dial (0 = leftmost, 1 = rightmost) to an SVG point on the arc. */
function fractionToPoint(fraction: number) {
  const angle = (-90 + fraction * 180) * (Math.PI / 180);
  return {
    x: CENTER + RADIUS * Math.sin(angle),
    y: CENTER - RADIUS * Math.cos(angle),
  };
}

function describeArc(fromFraction: number, toFraction: number) {
  const start = fractionToPoint(fromFraction);
  const end = fractionToPoint(toFraction);
  const largeArc = toFraction - fromFraction > 0.999 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Inverse of fractionToPoint: the dial position under a pointer, given its distance from center. */
function pointerToFraction(dx: number, dy: number) {
  const angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
  return clamp((angleDeg + 90) / 180, 0, 1);
}

export function TempoControl({ bpm, onChange }: TempoControlProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(bpm));

  // Keeps the draft in step with external changes (dial drag, tap tempo,
  // +/- buttons, a different song loading) as long as the field itself
  // isn't what's currently being typed into.
  useEffect(() => {
    if (!isEditing) setDraftValue(String(bpm));
  }, [bpm, isEditing]);

  const fraction = clamp((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM), 0, 1);
  const handle = fractionToPoint(fraction);

  const startEditing = () => {
    setDraftValue(String(bpm));
    setIsEditing(true);
  };

  const commitDraft = () => {
    const parsed = parseInt(draftValue, 10);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed, MIN_BPM, MAX_BPM));
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * VIEW_WIDTH;
      const y = ((clientY - rect.top) / rect.height) * VIEW_HEIGHT;
      const next = pointerToFraction(x - CENTER, y - CENTER);
      onChange(Math.round(MIN_BPM + next * (MAX_BPM - MIN_BPM)));
    },
    [onChange]
  );

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.buttons !== 1) return;
    setFromPointer(event.clientX, event.clientY);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 5 : 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(clamp(bpm + step, MIN_BPM, MAX_BPM));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(clamp(bpm - step, MIN_BPM, MAX_BPM));
    } else if (event.key === 'Home') {
      event.preventDefault();
      onChange(MIN_BPM);
    } else if (event.key === 'End') {
      event.preventDefault();
      onChange(MAX_BPM);
    }
  };

  return (
    <div className="flex w-full items-center justify-center gap-2">
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className="text-orange-500 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-400"
        onClick={() => onChange(clamp(bpm - 1, MIN_BPM, MAX_BPM))}
      >
        <Minus />
        <span className="sr-only">{t('Decrease tempo')}</span>
      </Button>

      <div className="relative w-full max-w-[220px] select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="w-full h-auto cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <path
            d={describeArc(0, 1)}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            className="stroke-muted"
          />
          <path
            d={describeArc(0, fraction)}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            className="stroke-orange-500 dark:stroke-orange-400"
          />
          <circle
            cx={handle.x}
            cy={handle.y}
            r={HANDLE_RADIUS}
            strokeWidth={3}
            className="fill-orange-500 stroke-popover dark:fill-orange-400"
            tabIndex={0}
            role="slider"
            aria-labelledby={labelId}
            aria-valuemin={MIN_BPM}
            aria-valuemax={MAX_BPM}
            aria-valuenow={bpm}
            onKeyDown={handleKeyDown}
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-[58%] flex flex-col items-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={MIN_BPM}
              max={MAX_BPM}
              value={draftValue}
              onChange={event => setDraftValue(event.target.value)}
              onBlur={commitDraft}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitDraft();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  setIsEditing(false);
                }
              }}
              aria-label={t('BPM')}
              autoFocus
              className="pointer-events-auto w-[4.5ch] bg-transparent text-center text-5xl font-bold tabular-nums leading-none outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              aria-label={t('BPM')}
              className="pointer-events-auto text-5xl font-bold tabular-nums leading-none hover:text-orange-500 dark:hover:text-orange-400"
            >
              {bpm}
            </button>
          )}
          <span id={labelId} className="mt-1 text-xs text-muted-foreground">
            {t('BPM')}
          </span>
        </div>
      </div>

      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className="text-orange-500 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-400"
        onClick={() => onChange(clamp(bpm + 1, MIN_BPM, MAX_BPM))}
      >
        <Plus />
        <span className="sr-only">{t('Increase tempo')}</span>
      </Button>
    </div>
  );
}
