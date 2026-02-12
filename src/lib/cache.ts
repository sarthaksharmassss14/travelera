/**
 * Simple client-side cache utility using localStorage
 */

type CacheItem<T> = {
    data: T;
    timestamp: number;
};

export const cacheService = {
    set: <T>(key: string, data: T, ttlHours: number = 1): void => {
        if (typeof window === "undefined") return;
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(item));
    },

    get: <T>(key: string, ttlHours: number = 1): T | null => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        try {
            const item: CacheItem<T> = JSON.parse(raw);
            const now = Date.now();
            const ttlMs = ttlHours * 60 * 60 * 1000;

            if (now - item.timestamp < ttlMs) {
                return item.data;
            }

            // Expired
            localStorage.removeItem(key);
            return null;
        } catch (e) {
            return null;
        }
    },

    generateKey: (...args: any[]): string => {
        return args
            .map((arg) =>
                typeof arg === 'string'
                    ? arg.toLowerCase().replace(/\s+/g, '_')
                    : JSON.stringify(arg)
            )
            .join(':');
    }
};
