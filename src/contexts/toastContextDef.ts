import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
