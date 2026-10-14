import { Trash2 } from 'lucide-react';
import { useSwipeToReveal } from '@/hooks/useSwipeToReveal';
import type { ReactNode } from 'react';

interface SwipeToDeleteRowProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
}

/** Telegram-style swipe-left-to-reveal-delete. First swipe reveals the button; tapping it deletes. */
export function SwipeToDeleteRow({
  children,
  onDelete,
  deleteLabel = 'Delete',
}: SwipeToDeleteRowProps) {
  const swipe = useSwipeToReveal();

  return (
    <div className="relative overflow-hidden rounded">
      <button
        type="button"
        title={deleteLabel}
        onClick={() => {
          swipe.close();
          onDelete();
        }}
        style={{ width: swipe.revealWidth }}
        className="absolute inset-y-0 right-0 flex items-center justify-center gap-1 bg-red-600 text-white text-xs font-medium"
      >
        <Trash2 className="w-4 h-4" />
        {deleteLabel}
      </button>

      <div
        style={swipe.style}
        {...swipe.handlers}
        onClickCapture={event => {
          if (!swipe.isOpen) return;
          event.preventDefault();
          event.stopPropagation();
          swipe.close();
        }}
      >
        {children}
      </div>
    </div>
  );
}
