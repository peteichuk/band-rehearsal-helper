export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = () => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

const DEFAULT_DURATION_MS = 3000;

/**
 * Queues a short-lived status message (e.g. "Favorites reset.") — rendered
 * by the <Toaster/> mounted once at the app root, so it outlives whatever
 * modal triggered it. Multiple toasts stack and each dismisses itself on
 * its own timer, so they disappear in the order they were shown.
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  durationMs = DEFAULT_DURATION_MS
) {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => dismissToast(id), durationMs);
}

export function dismissToast(id: number) {
  toasts = toasts.filter(toast => toast.id !== id);
  notify();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastsSnapshot(): Toast[] {
  return toasts;
}
