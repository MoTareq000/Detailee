import { useEffect, useState } from 'react';
import './Toast.css';
import { registerToastSetter, type ToastState, type ToastType } from './toastStore';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type} ${visible ? 'show' : 'hide'}`} id="toast">
            <span>{message}</span>
        </div>
    );
}

export function ToastContainer() {
    const [toast, setToast] = useState<ToastState | null>(null);

    useEffect(() => {
        registerToastSetter(setToast);
        return () => { registerToastSetter(null); };
    }, []);

    if (!toast) return null;

    return (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
        />
    );
}
