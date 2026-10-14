import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

interface ToggleButtonPairProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: [ToggleOption<T>, ToggleOption<T>];
  activeClassName?: string;
  inactiveClassName?: string;
}

/** Two-option segmented control that behaves like a radio-button pair. */
export function ToggleButtonPair<T extends string>({
  value,
  onChange,
  options,
  activeClassName = 'bg-blue-700 dark:bg-blue-600 text-white',
  inactiveClassName = 'text-current/70 hover:bg-black/10 dark:hover:bg-white/10',
}: ToggleButtonPairProps<T>) {
  return (
    <div role="radiogroup" className="flex items-center rounded bg-black/10 dark:bg-white/10 p-0.5">
      {options.map(option => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded transition-colors',
              isActive ? activeClassName : inactiveClassName
            )}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
