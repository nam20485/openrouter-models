import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, delayMs = 300): T => {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(id);
    }, [value, delayMs]);

    return debounced;
};
