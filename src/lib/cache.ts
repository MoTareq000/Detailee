interface CacheEnvelope<T> {
    timestamp: number;
    data: T;
}

function getStorageKey(key: string) {
    return `detailee_cache_${key}`;
}

export function readCachedValue<T>(key: string, maxAgeMs: number) {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(getStorageKey(key));
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as CacheEnvelope<T>;
        if (!parsed || typeof parsed.timestamp !== 'number') {
            window.sessionStorage.removeItem(getStorageKey(key));
            return null;
        }

        if (Date.now() - parsed.timestamp > maxAgeMs) {
            window.sessionStorage.removeItem(getStorageKey(key));
            return null;
        }

        return parsed.data;
    } catch {
        return null;
    }
}

export function writeCachedValue<T>(key: string, data: T) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const payload: CacheEnvelope<T> = {
            timestamp: Date.now(),
            data,
        };
        window.sessionStorage.setItem(getStorageKey(key), JSON.stringify(payload));
    } catch {
        // Ignore storage quota issues.
    }
}
