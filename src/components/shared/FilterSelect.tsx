import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterSelectProps {
  /** The trigger's visible text — computed by the caller from its own value (e.g. "All groups" or "Languages (2)"). */
  label: ReactNode;
  disabled?: boolean;
  /** DropdownMenuItem/DropdownMenuCheckboxItem rows — single-select vs multi-select is entirely up to what the caller renders here. */
  children: ReactNode;
  className?: string;
}

/**
 * Shared shell for the catalog's filter pickers (GroupFilterSelect,
 * LanguageFilterSelect) — a DropdownMenu, not the shadcn Select, since one
 * of them needs multi-select checkboxes that Select can't do. Having both
 * build on this one component (instead of each hand-rolling the same
 * trigger/content wiring) is what keeps them from drifting out of sync with
 * each other visually, which happened more than once before this existed.
 */
export function FilterSelect({ label, disabled, children, className }: FilterSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full sm:w-48 justify-between font-normal bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
            className
          )}
        >
          {label}
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      {/* w-(--radix-dropdown-menu-trigger-width) + max-w-none — matches the
          trigger's own width instead of always opening at a fixed, narrower
          box regardless of the trigger (min-w-48 as a floor for a short
          trigger/long option list). */}
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-48 max-w-none"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
