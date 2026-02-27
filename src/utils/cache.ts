import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cache = {
    /**
     * Save data to cache
     * @param key Storage key
     * @param data Data to store
     */
    save: async <T>(key: string, data: T): Promise<void> => {
        try {
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.error(`[Cache] Error saving key ${key}:`, error);
        }
    },

    /**
     * Load data from cache if valid
     * @param key Storage key
     * @param duration Valid duration in milliseconds (default 24h)
     * @returns Data or null if expired/missing
     */
    load: async <T>(
        key: string,
        duration: number = DEFAULT_CACHE_DURATION
    ): Promise<T | null> => {
        try {
            const cachedString = await AsyncStorage.getItem(key);
            if (!cachedString) return null;

            const item: CacheItem<T> = JSON.parse(cachedString);
            const isFresh = Date.now() - item.timestamp < duration;

            if (isFresh) {
                // console.log(`[Cache] Hit for ${key}`);
                return item.data;
            } else {
                console.log(`[Cache] Expired for ${key}`);
                // Optionally remove? Or just overwrite later.
                // await AsyncStorage.removeItem(key); 
                return null;
            }
        } catch (error) {
            console.error(`[Cache] Error loading key ${key}:`, error);
            return null;
        }
    },

    /**
     * Remove item from cache
     */
    remove: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`[Cache] Error removing key ${key}:`, error);
        }
    },
};
