import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration: number = 4000
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { id, type, message, title, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title: string = 'Éxito') => {
    showToast(message, 'success', title);
  }, [showToast]);

  const error = useCallback((message: string, title: string = 'Error') => {
    showToast(message, 'error', title);
  }, [showToast]);

  const warning = useCallback((message: string, title: string = 'Advertencia') => {
    showToast(message, 'warning', title);
  }, [showToast]);

  const info = useCallback((message: string, title: string = 'Información') => {
    showToast(message, 'info', title);
  }, [showToast]);

  const value = useMemo<ToastContextType>(() => ({
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
  }), [toasts, showToast, success, error, warning, info, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor flotante de notificaciones toast */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const config = {
            success: {
              bgColor: 'bg-emerald-50 border-emerald-300 text-emerald-900',
              iconColor: 'text-emerald-600',
              icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
              defaultTitle: 'Operación exitosa',
            },
            error: {
              bgColor: 'bg-rose-50 border-rose-300 text-rose-900',
              iconColor: 'text-rose-600',
              icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
              defaultTitle: 'Error en la operación',
            },
            warning: {
              bgColor: 'bg-amber-50 border-amber-300 text-amber-900',
              iconColor: 'text-amber-600',
              icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
              defaultTitle: 'Atención requerida',
            },
            info: {
              bgColor: 'bg-sky-50 border-sky-300 text-sky-900',
              iconColor: 'text-sky-600',
              icon: <Info className="w-5 h-5 flex-shrink-0" />,
              defaultTitle: 'Información',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-md transition-all duration-200 transform translate-y-0 ${config.bgColor}`}
            >
              <span className={`mt-0.5 ${config.iconColor}`}>{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  {toast.title || config.defaultTitle}
                </p>
                <p className="text-xs mt-1 leading-snug break-words">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 rounded p-1 transition-colors cursor-pointer"
                title="Cerrar notificación"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider.');
  }
  return context;
};
