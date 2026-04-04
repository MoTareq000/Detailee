export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
    message: string;
    type?: ToastType;
}

type ToastSetter = (toast: ToastState | null) => void;

let toastSetter: ToastSetter | null = null;

export function registerToastSetter(setter: ToastSetter | null) {
    toastSetter = setter;
}

export function showToast(message: string, type: ToastType = 'info') {
    toastSetter?.({ message, type });
}
