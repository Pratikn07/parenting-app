import { useCallback, useEffect, useState } from 'react';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '@/src/services/searchHistoryService';
import { getTrendingSearches, logSearchQuery } from '@/src/services/recipeService';

interface UseSearchSuggestionsResult {
  recentSearches: string[];
  trendingSearches: string[];
  recordRecent: (query: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeRecent: (query: string) => Promise<void>;
  logSearch: (userId: string, query: string) => Promise<void>;
}

export function useSearchSuggestions(): UseSearchSuggestionsResult {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
    getTrendingSearches().then(setTrendingSearches);
  }, []);

  const recordRecent = useCallback(async (query: string) => {
    await addRecentSearch(query);
    const updated = await getRecentSearches();
    setRecentSearches(updated);
  }, []);

  const clearHistory = useCallback(async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const removeRecent = useCallback(async (query: string) => {
    await removeRecentSearch(query);
    const updated = await getRecentSearches();
    setRecentSearches(updated);
  }, []);

  const logSearch = useCallback(async (userId: string, query: string) => {
    await logSearchQuery(userId, query);
  }, []);

  return {
    recentSearches,
    trendingSearches,
    recordRecent,
    clearHistory,
    removeRecent,
    logSearch,
  };
}
