type Listener = () => void;

// Reference-counted rather than a plain boolean: lets overlapping gestures
// (unlikely, but e.g. a stray second touch) each hold their own lock without
// one's early release re-enabling pull-to-refresh out from under the other.
let activeCount = 0;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

/**
 * Call when a gesture that pull-to-refresh must not interrupt starts —
 * drag-reorder (useDragReorder) or swipe-to-delete (useSwipeToReveal).
 * Both live inside the same scroll container pull-to-refresh listens on, so
 * without this, picking up a drag handle or starting a swipe near the top
 * of the list can also register as a downward pull and trigger a refetch
 * mid-gesture, discarding whatever local reorder/swipe state was in flight.
 */
export function beginInteraction() {
  activeCount += 1;
  if (activeCount === 1) notify();
}

export function endInteraction() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) notify();
}

export function isInteractionActive(): boolean {
  return activeCount > 0;
}

export function subscribeInteractionLock(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
