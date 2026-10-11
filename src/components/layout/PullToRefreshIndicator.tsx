import ReloadIcon from '@/assets/icons/refresh.svg?react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isDragging: boolean;
  isRefreshing: boolean;
  threshold: number;
}

/** Sits above the scroll container's content, revealed as it's pulled down. */
export function PullToRefreshIndicator({
  pullDistance,
  isDragging,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const visible = isRefreshing || pullDistance > 0;

  return (
    <div
      className="absolute inset-x-0 top-0 flex justify-center overflow-hidden pointer-events-none"
      style={{
        height: pullDistance,
        transition: isDragging ? 'none' : 'height 200ms ease-out',
      }}
    >
      <div
        className={cn(
          'mt-3 w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400',
          !visible && 'opacity-0'
        )}
      >
        <ReloadIcon
          className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
          style={isRefreshing ? undefined : { transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
    </div>
  );
}
