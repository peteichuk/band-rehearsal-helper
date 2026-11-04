import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { beginInteraction, endInteraction } from '@/lib/interactionLock';

// A little give past the grid's own edges — clamping exactly at the edge
// felt like hitting a wall; this lets the tile nudge slightly past it
// before stopping.
const BOUNDS_SLACK = 10;
// How long the dragged tile (and any sibling still offset when the pointer
// is released) takes to animate back to its resting transform, instead of
// snapping there instantly.
const RESET_TRANSITION_MS = 150;

interface UseGridDragReorderOptions {
  items: string[];
  onReorder: (nextOrder: string[]) => void;
}

/**
 * Pointer-based 2D reorder for a wrapping CSS grid (tiles) — useDragReorder's
 * vertical-only midpoint math doesn't apply here, since a row can wrap at
 * any column count, so "above/below" alone can't tell which slot the
 * pointer is over. Same single-commit contract as useDragReorder though:
 * dragging only *previews* (the grabbed tile tracks the pointer in both
 * axes, every other tile ripples to its own natural rect at the new slot),
 * onReorder fires once, on release, with the final order.
 */
export function useGridDragReorder({ items, onReorder }: UseGridDragReorderOptions) {
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const cellRefs = useRef(new Map<string, HTMLElement>());
  const pointerIdRef = useRef<number | null>(null);
  // Index-aligned with the `order` snapshot taken at drag-start — captured
  // once and never re-measured, same reasoning as useDragReorder (re-reading
  // a mid-transform rect would feed an already-shifted position back into
  // the next hit-test).
  const naturalRectsRef = useRef<DOMRect[]>([]);
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const fromIndexRef = useRef(-1);
  const toIndexRef = useRef(-1);
  // The grid's own bounding box, from the union of every tile's natural
  // rect at drag-start — clamps the dragged tile so it can never visually
  // slide out past the grid's own edges (e.g. up under a sticky header
  // above it), rather than relying on z-index to win that overlap.
  const boundsRef = useRef({ left: 0, top: 0, right: 0, bottom: 0 });

  const setCellRef = (name: string) => (el: HTMLElement | null) => {
    if (el) cellRefs.current.set(name, el);
    else cellRefs.current.delete(name);
  };

  /**
   * Pins the dragged tile under the pointer at the same spot it was grabbed,
   * using its drag-start (never re-measured) rect. `translate()` is relative
   * to the tile's own natural (pre-transform) position, not an absolute
   * page position — so the desired absolute top-left (pointer minus the
   * grab offset) has to have that natural position subtracted back out, or
   * the tile jumps off by its own rect.left/top the instant the drag starts.
   */
  const trackPointer = (name: string, clientX: number, clientY: number) => {
    const el = cellRefs.current.get(name);
    const natural = naturalRectsRef.current[fromIndexRef.current];
    if (!el || !natural) return;
    let dx = clientX - grabOffsetRef.current.x - natural.left;
    let dy = clientY - grabOffsetRef.current.y - natural.top;
    const { left, top, right, bottom } = boundsRef.current;
    dx = Math.min(
      Math.max(dx, left - natural.left - BOUNDS_SLACK),
      right - natural.right + BOUNDS_SLACK
    );
    dy = Math.min(
      Math.max(dy, top - natural.top - BOUNDS_SLACK),
      bottom - natural.bottom + BOUNDS_SLACK
    );
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  /**
   * Which natural slot the pointer currently sits over. Falls back to the
   * nearest slot's center once the pointer strays outside every rect (e.g.
   * dragged below the grid's last row) — without this, dragging past the
   * edge would simply stop updating the target instead of snapping to the
   * nearest end.
   */
  const slotAt = (x: number, y: number): number => {
    const rects = naturalRectsRef.current;
    for (let index = 0; index < rects.length; index++) {
      const rect = rects[index];
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return index;
    }
    let nearest = 0;
    let bestDistance = Infinity;
    rects.forEach((rect, index) => {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = (x - cx) ** 2 + (y - cy) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = index;
      }
    });
    return nearest;
  };

  /**
   * Each sibling's target slot is exactly the index it would land on after
   * `splice(from, 1); splice(to, 0, dragged)` — ripples every tile between
   * `from` and `to` by one slot, same shape as useDragReorder's shift, just
   * resolved against the actual target slot's rect instead of a fixed row
   * height (a grid's "next slot" can be a different row entirely).
   */
  const updatePreview = (name: string, order: string[], x: number, y: number) => {
    const from = fromIndexRef.current;
    const to = slotAt(x, y);
    toIndexRef.current = to;

    order.forEach((itemName, index) => {
      if (itemName === name) return;
      const el = cellRefs.current.get(itemName);
      const ownRect = naturalRectsRef.current[index];
      if (!el || !ownRect) return;

      let targetIndex = index;
      if (index > from && index <= to) targetIndex = index - 1;
      else if (index < from && index >= to) targetIndex = index + 1;

      const targetRect = naturalRectsRef.current[targetIndex];
      if (!targetRect) return;
      const dx = targetRect.left - ownRect.left;
      const dy = targetRect.top - ownRect.top;
      el.style.transition = 'transform 150ms ease';
      el.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : '';
    });
  };

  /** Animates back to resting position instead of snapping there — the dragged tile itself was tracking the pointer with `transition: none`, so this is also what turns transitions back on for it. */
  const resetCellStyle = (name: string) => {
    const el = cellRefs.current.get(name);
    if (!el) return;
    el.style.transition = `transform ${RESET_TRANSITION_MS}ms ease`;
    el.style.transform = '';
    window.setTimeout(() => {
      el.style.transition = '';
    }, RESET_TRANSITION_MS);
  };

  const endDrag = (name: string, order: string[]) => {
    pointerIdRef.current = null;
    setDraggingName(null);
    order.forEach(resetCellStyle);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    endInteraction();

    const from = fromIndexRef.current;
    const to = toIndexRef.current;
    fromIndexRef.current = -1;
    toIndexRef.current = -1;
    if (from === -1 || to === -1) return;

    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, name);
    const changed = next.some((n, index) => n !== order[index]);
    if (changed) onReorder(next);
  };

  const getHandleProps = (name: string) => ({
    onPointerDown: (event: ReactPointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const order = items;
      pointerIdRef.current = event.pointerId;
      fromIndexRef.current = order.indexOf(name);
      toIndexRef.current = fromIndexRef.current;

      naturalRectsRef.current = order.map(
        itemName => cellRefs.current.get(itemName)?.getBoundingClientRect() as DOMRect
      );
      const ownRect = naturalRectsRef.current[fromIndexRef.current];
      grabOffsetRef.current = {
        x: event.clientX - (ownRect?.left ?? event.clientX),
        y: event.clientY - (ownRect?.top ?? event.clientY),
      };
      boundsRef.current = {
        left: Math.min(...naturalRectsRef.current.map(r => r.left)),
        top: Math.min(...naturalRectsRef.current.map(r => r.top)),
        right: Math.max(...naturalRectsRef.current.map(r => r.right)),
        bottom: Math.max(...naturalRectsRef.current.map(r => r.bottom)),
      };

      setDraggingName(name);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      beginInteraction();
      trackPointer(name, event.clientX, event.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerIdRef.current) return;
        trackPointer(name, moveEvent.clientX, moveEvent.clientY);
        updatePreview(name, order, moveEvent.clientX, moveEvent.clientY);
      };
      const handlePointerUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerIdRef.current) return;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        endDrag(name, order);
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
  });

  return {
    draggingName,
    setCellRef,
    getHandleProps,
  };
}
