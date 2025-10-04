import { toast as originalToast, ToastOptions } from 'react-hot-toast';
import type { JSX } from 'react';

const RELOAD_DELAY = 1000; // 1 second

const reloadPage = () => {
    setTimeout(() => {
        window.location.reload();
    }, RELOAD_DELAY);
};

export const toast = {
    /**
     * Shows a success toast and reloads the page after a short delay.
     */
    // FIX: Changed message type from React.ReactNode to string | JSX.Element to match react-hot-toast's Message type.
    success: (message: string | JSX.Element, options?: ToastOptions) => {
        originalToast.success(message, options);
        reloadPage();
    },
    
    /**
     * Shows an error toast. Does not reload the page.
     */
    // FIX: Changed message type from React.ReactNode to string | JSX.Element to match react-hot-toast's Message type.
    error: (message: string | JSX.Element, options?: ToastOptions) => {
        originalToast.error(message, options);
    },
    
    /**
     * Shows a loading toast. Does not reload the page.
     */
    // FIX: Changed message type from React.ReactNode to string | JSX.Element to match react-hot-toast's Message type.
    loading: (message: string | JSX.Element, options?: ToastOptions) => {
        return originalToast.loading(message, options);
    },

    /**
     * Dismisses a toast.
     */
    dismiss: (toastId?: string) => {
        originalToast.dismiss(toastId);
    },
};
