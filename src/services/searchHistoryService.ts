import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@recent_searches';
const MAX_HISTORY = 10; // Keep last 10 searches

interface SearchHistoryItem {
    query: string;
    timestamp: number;
}

/**
 * Add a search query to recent searches
 * Deduplicates and moves existing queries to the top
 */
export async function addRecentSearch(query: string): Promise<void> {
    try {
        if (!query || query.trim().length === 0) return;

        const trimmedQuery = query.trim().toLowerCase();
        const history = await getRecentSearchesWithTimestamp();

        // Remove existing entry if it exists (deduplicate)
        const filteredHistory = history.filter(item => item.query !== trimmedQuery);

        // Add new search at the beginning
        const newHistory: SearchHistoryItem[] = [
            { query: trimmedQuery, timestamp: Date.now() },
            ...filteredHistory
        ].slice(0, MAX_HISTORY); // Keep only last MAX_HISTORY items

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error('Error adding recent search:', error);
    }
}

/**
 * Get recent searches (returns just the query strings)
 */
export async function getRecentSearches(): Promise<string[]> {
    try {
        const history = await getRecentSearchesWithTimestamp();
        return history.map(item => item.query);
    } catch (error) {
        console.error('Error getting recent searches:', error);
        return [];
    }
}

/**
 * Get recent searches with full metadata (internal helper)
 */
async function getRecentSearchesWithTimestamp(): Promise<SearchHistoryItem[]> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const parsed = JSON.parse(data) as SearchHistoryItem[];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error parsing recent searches:', error);
        return [];
    }
}

/**
 * Clear all recent searches
 */
export async function clearRecentSearches(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing recent searches:', error);
    }
}

/**
 * Remove a specific search from history
 */
export async function removeRecentSearch(query: string): Promise<void> {
    try {
        const history = await getRecentSearchesWithTimestamp();
        const filteredHistory = history.filter(item => item.query !== query.trim().toLowerCase());
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
        console.error('Error removing recent search:', error);
    }
}
