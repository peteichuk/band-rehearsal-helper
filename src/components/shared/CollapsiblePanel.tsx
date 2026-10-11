import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CollapsiblePanelProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

/** Collapses/expands `children` top-to-bottom via CSS grid-rows (no JS height measuring). */
export function CollapsiblePanel({ open, children, className }: CollapsiblePanelProps) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}
    >
      <div className={cn('overflow-hidden min-h-0', className)}>{children}</div>
    </div>
  );
}
