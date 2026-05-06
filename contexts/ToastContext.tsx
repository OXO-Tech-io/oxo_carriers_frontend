'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ── Types ──────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;   // ms; 0 = persist until manually closed
  exiting?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id' | 'exiting'>) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error:   (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info:    (title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 320);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, exiting: true })));
    setTimeout(() => setToasts([]), 320);
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, 'id' | 'exiting'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = opts.duration ?? 4500;
      setToasts((prev) => [...prev, { ...opts, id, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'success', title, message, duration }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'error', title, message, duration: duration ?? 6000 }),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'warning', title, message, duration }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'info', title, message, duration }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ── Config per type ────────────────────────────────────────────────────────
const CONFIG: Record<
  ToastType,
  { icon: React.ElementType; bg: string; border: string; iconColor: string; titleColor: string; msgColor: string; progressColor: string }
> = {
  success: {
    icon: CheckCircleIcon,
    bg: '#F0FDF4',
    border: '#86EFAC',
    iconColor: '#16A34A',
    titleColor: '#14532D',
    msgColor: '#166534',
    progressColor: '#16A34A',
  },
  error: {
    icon: XCircleIcon,
    bg: '#FEF2F2',
    border: '#FCA5A5',
    iconColor: '#DC2626',
    titleColor: '#7F1D1D',
    msgColor: '#991B1B',
    progressColor: '#DC2626',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bg: '#FFFBEB',
    border: '#FCD34D',
    iconColor: '#D97706',
    titleColor: '#78350F',
    msgColor: '#92400E',
    progressColor: '#D97706',
  },
  info: {
    icon: InformationCircleIcon,
    bg: '#EFF6FF',
    border: '#93C5FD',
    iconColor: '#2563EB',
    titleColor: '#1E3A8A',
    msgColor: '#1E40AF',
    progressColor: '#2563EB',
  },
};

// ── Single Toast item ──────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = CONFIG[toast.type];
  const Icon = cfg.icon;
  const duration = toast.duration ?? 4500;
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current || duration <= 0) return;
    const el = progressRef.current;
    el.style.transition = 'none';
    el.style.width = '100%';
    // Force reflow
    void el.offsetWidth;
    el.style.transition = `width ${duration}ms linear`;
    el.style.width = '0%';
  }, [duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        minWidth: '320px',
        maxWidth: '420px',
        pointerEvents: 'all',
      }}
    >
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Icon
          className="h-5 w-5 shrink-0 mt-0.5"
          style={{ color: cfg.iconColor }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: cfg.titleColor }}
          >
            {toast.title}
          </p>
          {toast.message && (
            <p
              className="mt-0.5 text-sm leading-relaxed"
              style={{ color: cfg.msgColor }}
            >
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-lg p-1 transition-colors duration-150 hover:bg-black/10"
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="h-4 w-4" style={{ color: cfg.iconColor }} />
        </button>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-1" style={{ background: `${cfg.border}80` }}>
          <div
            ref={progressRef}
            style={{
              height: '100%',
              background: cfg.progressColor,
              borderRadius: '0 0 12px 12px',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Container ──────────────────────────────────────────────────────────────
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
