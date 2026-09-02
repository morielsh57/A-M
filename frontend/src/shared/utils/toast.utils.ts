import type React from 'react';
import { toast, type ToastOptions } from 'react-toastify';

type ToastAppearance = 'success' | 'error' | 'warning' | 'info';

interface AppToastOptions {
  appearance?: ToastAppearance;
  autoDismiss?: boolean;
}

export const addToast = (
  message: React.ReactNode,
  options?: AppToastOptions,
) => {
  const toastOptions: ToastOptions = {
    autoClose: options?.autoDismiss === false ? false : undefined,
  };

  if (options?.appearance) {
    return toast[options.appearance](message, toastOptions);
  }

  return toast(message, toastOptions);
};
