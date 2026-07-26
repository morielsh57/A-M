import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type ToastAppearance = 'success' | 'error' | 'warning' | 'info';

type ToastOptions = {
  appearance?: ToastAppearance;
  autoDismiss?: boolean;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>
    {children}
    <ToastContainer />
  </>
);

export const useToasts = () => ({
  addToast: (message: React.ReactNode, options?: ToastOptions) => {
    const toastOptions = {
      autoClose: options?.autoDismiss === false ? false as const : undefined,
    };

    if (options?.appearance && toast[options.appearance]) {
      return toast[options.appearance](message, toastOptions);
    }

    return toast(message, toastOptions);
  },
});
