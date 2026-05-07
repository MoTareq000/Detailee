import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

export function usePersistentState<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;

        try {
            const storedValue = window.localStorage.getItem(key);
            if (!storedValue) return initialValue;
            return JSON.parse(storedValue) as T;
        } catch (error) {
            console.error(`Failed to read localStorage key "${key}"`, error);
            try {
                window.localStorage.removeItem(key);
            } catch {
                // no-op
            }
            return initialValue;
        }
    });

    const setPersistentValue: Dispatch<SetStateAction<T>> = useCallback((nextValueOrUpdater) => {
        if (typeof window === 'undefined') {
            setValue(nextValueOrUpdater);
            return;
        }

        setValue((previousValue) => {
            const nextValue = nextValueOrUpdater instanceof Function
                ? nextValueOrUpdater(previousValue)
                : nextValueOrUpdater;

            try {
                window.localStorage.setItem(key, JSON.stringify(nextValue));
            } catch (error) {
                console.error(`Failed to write localStorage key "${key}"`, error);
            }

            return nextValue;
        });
    }, [key]);

    const clearValue = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Failed to clear localStorage key "${key}"`, error);
        }
    }, [key]);

    return [value, setPersistentValue, clearValue] as const;
}
