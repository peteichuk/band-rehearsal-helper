import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { beginInteraction, endInteraction } from '@/lib/interactionLock';

interface UseDragReorderOptions {
  items: string[];
  onReorder: (nextOrder: string[]) => void;
}

/**
 * Pointer-based (mouse + touch) vertical reorder, driven from a dedicated
 * grip handle rather than the whole row. Positions only actually change
 * once, on release — for the whole drag this only ever *shows* where the
 * item would land:
 *  - the dragged row tracks the pointer 1:1 with no transition, for
 *    zero-lag "it's stuck to your finger/cursor" feedback;
 *  - every other row shifts out of the way (a plain translateY) to preview
 *    the gap opening, each one computed independently by comparing the
 *    pointer directly against *that row's own* natural midpoint — not by
 *    converting a single cumulative "target index" into a shift range,
 *    which doesn't round-trip cleanly back to "no shift" when the dragged
 *    row returns to its own original slot (it would keep nudging its
 *    immediate neighbor out of the way even at zero net movement).
 * Both effects are computed purely from each row's position captured once
 * at drag-start, never by re-measuring a row's current (possibly
 * mid-animation) rect — reordering the real DOM/array on every pointermove
 * (an earlier version of this hook) fed an already-transformed row's rect
 * back into the next hit-test, which could flip two overlapping rows back
 * and forth forever. `onReorder` fires once, on pointer-up, with the final
 * order — computed as how many *other* rows' natural midpoints the pointer
 * currently sits below, which is exactly the right-shaped index for
 * `splice(from, 1); splice(to, 0, item)` (an index into the array with the
 * dragged item already removed).
 */
export function useDragReorder({ items, onReorder }: UseDragReorderOptions) {
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const pointerIdRef = useRef<number | null>(null);
  const naturalRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const fromIndexRef = useRef(-1);
  const toIndexRef = useRef(-1);
  const slotHeightRef = useRef(0);

  const setRowRef = (name: string) => (el: HTMLElement | null) => {
    if (el) rowRefs.current.set(name, el);
    else rowRefs.current.delete(name);
  };

  /** Pins the dragged row's center to the pointer, using its drag-start (never re-measured) rect. */
  const trackPointer = (name: string, pointerY: number) => {
    const el = rowRefs.current.get(name);
    const natural = naturalRectsRef.current.get(name);
    if (!el || !natural) return;
    const offset = pointerY - (natural.top + natural.height / 2);
    el.style.transition = 'none';
    el.style.transform = `translateY(${offset}px)`;
  };

  /**
   * Recomputes the drop target and each sibling's gap-preview shift, purely
   * from the drag-start rects + the live pointer position — no accumulated
   * state, so dragging away and back to the exact start always re-settles
   * every row to zero shift, never leaves a neighbor nudged out of place.
   */
  const updatePreview = (name: string, order: string[], pointerY: number) => {
    const from = fromIndexRef.current;
    const height = slotHeightRef.current;
    let to = 0;

    order.forEach((rowName, index) => {
      if (rowName === name) return;
      const el = rowRefs.current.get(rowName);
      const rect = naturalRectsRef.current.get(rowName);
      if (!el || !rect) return;
      const midpoint = rect.top + rect.height / 2;

      if (midpoint < pointerY) to += 1;

      let shift = 0;
      // A sibling that started before the dragged row shifts down once the
      // dragged row has moved above it; one that started after shifts up
      // once the dragged row has moved below it. Each check is independent
      // and only ever looks at that row's own fixed natural midpoint.
      if (index < from && pointerY < midpoint) shift = height;
      else if (index > from && pointerY > midpoint) shift = -height;

      el.style.transition = 'transform 150ms ease';
      el.style.transform = shift ? `translateY(${shift}px)` : '';
    });

    toIndexRef.current = to;
  };

  const resetRowStyle = (name: string) => {
    const el = rowRefs.current.get(name);
    if (!el) return;
    el.style.transition = '';
    el.style.transform = '';
  };

  const endDrag = (name: string, order: string[]) => {
    pointerIdRef.current = null;
    setDraggingName(null);
    order.forEach(resetRowStyle);
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
      const order = items;
      pointerIdRef.current = event.pointerId;
      fromIndexRef.current = order.indexOf(name);
      toIndexRef.current = fromIndexRef.current;

      naturalRectsRef.current = new Map(
        order
          .map(rowName => [rowName, rowRefs.current.get(rowName)?.getBoundingClientRect()] as const)
          .filter((entry): entry is [string, DOMRect] => Boolean(entry[1]))
      );
      const firstRect = naturalRectsRef.current.get(order[0]);
      const secondRect = order.length > 1 ? naturalRectsRef.current.get(order[1]) : undefined;
      slotHeightRef.current =
        firstRect && secondRect ? secondRect.top - firstRect.top : (firstRect?.height ?? 0);

      setDraggingName(name);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      beginInteraction();
      trackPointer(name, event.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerIdRef.current) return;
        trackPointer(name, moveEvent.clientY);
        updatePreview(name, order, moveEvent.clientY);
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
    orderedNames: items,
    setRowRef,
    getHandleProps,
  };
}
