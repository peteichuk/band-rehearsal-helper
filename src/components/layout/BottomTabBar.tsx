import { Folder, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogViewMode } from '@/types/pageActions';

interface BottomTabBarProps {
  value: CatalogViewMode;
  onChange: (mode: CatalogViewMode) => void;
  visible: boolean;
}

/**
 * List/Albums switcher — a floating rounded pill inset from the screen
 * edges, Telegram-style: translucent/blurred white card, icon-over-label
 * buttons, active tab shown purely via blue icon+label color (no fill).
 * Slides fully below the viewport (rather than unmounting) whenever we're
 * one level deeper — a song, or an album's own song list — where the
 * catalog view mode doesn't apply.
 */
export function BottomTabBar({ value, onChange, visible }: BottomTabBarProps) {
  return (
    <nav
      role="tablist"
      aria-label="Catalog view"
      aria-hidden={!visible}
      className={cn(
        'print:hidden fixed inset-x-4 bottom-4 z-40 flex rounded-full',
        'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md',
        'shadow-lg ring-1 ring-black/5 dark:ring-white/10',
        'transition-[transform,opacity] duration-200 ease-out',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(150%)',
        marginBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <button
        type="button"
        role="tab"
        tabIndex={visible ? 0 : -1}
        aria-selected={value === 'list'}
        onClick={() => onChange('list')}
        className="flex-1 flex items-center justify-center py-1.5"
      >
        <span
          className={cn(
            'flex flex-col items-center gap-0.5 px-4 py-1 rounded-2xl text-xs font-medium transition-colors',
            value === 'list'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-gray-100'
          )}
        >
          <List className="w-6 h-6" />
          List
        </span>
      </button>
      <button
        type="button"
        role="tab"
        tabIndex={visible ? 0 : -1}
        aria-selected={value === 'albums'}
        onClick={() => onChange('albums')}
        className="flex-1 flex items-center justify-center py-1.5"
      >
        <span
          className={cn(
            'flex flex-col items-center gap-0.5 px-4 py-1 rounded-2xl text-xs font-medium transition-colors',
            value === 'albums'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-gray-100'
          )}
        >
          <Folder className="w-6 h-6" />
          Albums
        </span>
      </button>
    </nav>
  );
}
