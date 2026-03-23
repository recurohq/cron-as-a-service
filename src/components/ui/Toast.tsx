"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 bg-[var(--bg)] border border-[var(--border)] rounded-md shadow-sm px-4 py-3 text-sm ${
                toast.type === 'success' ? 'border-l-2 border-l-[var(--green)]' :
                toast.type === 'error' ? 'border-l-2 border-l-[var(--red)]' :
                'border-l-2 border-l-[var(--accent)]'
              }`}
            >
              <p className="flex-1 text-[var(--text)]">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[var(--text-secondary)] hover:text-[var(--text)] text-sm leading-none flex-shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
