'use client';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastVariant = 'default' | 'success' | 'error' | 'info';
interface Toast { id: string; title?: string; message: string; variant: ToastVariant; ts: number; }

interface ToastContextValue {
  add: (t: Omit<Toast,'id'|'ts'> & { id?: string }) => string;
  remove: (id: string) => void;
}

const ToastsContext = createContext<ToastContextValue | null>(null);

export function useToasts() {
  const ctx = useContext(ToastsContext);
  if (!ctx) throw new Error('useToasts must be used within <ToastsProvider>');
  return ctx;
}

interface ProviderProps { children: React.ReactNode; }

export function ToastsProvider({ children }: ProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, any>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const tm = timeouts.current.get(id);
    if (tm) { clearTimeout(tm); timeouts.current.delete(id); }
  }, []);

  const add: ToastContextValue['add'] = useCallback(({ id, title, message, variant='default' }) => {
    const finalId = id || Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id: finalId, title, message, variant, ts: Date.now() }]);
    // auto-dismiss after 5s
    const tm = setTimeout(() => remove(finalId), 5000);
    timeouts.current.set(finalId, tm);
    return finalId;
  }, [remove]);

  // Clear timers on unmount
  useEffect(() => () => { for (const tm of timeouts.current.values()) clearTimeout(tm); }, []);

  return (
    <ToastsContext.Provider value={{ add, remove }}>
      {children}
      <Toaster toasts={toasts} onDismiss={remove} />
    </ToastsContext.Provider>
  );
}

interface ToasterProps { toasts: Toast[]; onDismiss: (id: string) => void; }

function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div className="toasts" role="region" aria-live="polite" aria-label="Notifications">
      <ul style={{ listStyle:'none', margin:0, padding:0 }}>
        {toasts.map(t => {
          const role = t.variant === 'error' ? 'alert' : 'status';
          return (
            <li key={t.id}>
              <div className={`toast toast-${t.variant}`} role={role} aria-atomic="true">
                <div className="toast-body">
                  {t.title && <strong className="toast-title">{t.title}</strong>}
                  <span className="toast-message">{t.message}</span>
                </div>
                <button
                  className="btn btn-invisible small toast-close"
                  aria-label="Dismiss notification"
                  onClick={() => onDismiss(t.id)}
                >×</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
