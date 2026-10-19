import { useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { dismissToast, getToastsSnapshot, subscribeToasts, type ToastType } from '@/lib/toast';

const TOAST_STYLES: Record<ToastType, { icon: typeof Info; border: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    border: 'border-green-500',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: XCircle,
    border: 'border-red-500',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    icon: Info,
    border: 'border-blue-500',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

/** Mounted once at the app root — renders whatever's in the shared toast queue (see src/lib/toast.ts), so a toast outlives the modal/action that triggered it. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map(toast => {
        const { icon: Icon, border, iconColor } = TOAST_STYLES[toast.type];
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border-2 ${border} bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-lg animate-in fade-in slide-in-from-bottom-2 dark:bg-gray-800 dark:text-gray-100`}
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
            <span>{toast.message}</span>
          </button>
        );
      })}
    </div>
  );
}
