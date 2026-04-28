import { useCallback, useEffect, useRef, useState } from 'react';
import { getFilteredRecipes } from '@/src/services/recipeService';
import type { Recipe } from '@/src/lib/types/recipes';
import { FEED_PAGE_SIZE } from '../constants';

interface UseRecipeFeedParams {
  mealType: string;
  cuisine: string;
  searchQuery: string;
  dietaryNeeds: string[];
}

interface UseRecipeFeedResult {
  recipes: Recipe[];
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useRecipeFeed({
  mealType,
  cuisine,
  searchQuery,
  dietaryNeeds,
}: UseRecipeFeedParams): UseRecipeFeedResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (reset) {
        setIsLoadingInitial(true);
        pageRef.current = 1;
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const currentPage = reset ? 1 : pageRef.current;

      try {
        const data = await getFilteredRecipes({
          page: currentPage,
          limit: FEED_PAGE_SIZE,
          mealType,
          cuisine,
          searchQuery,
          dietaryNeeds,
        });

        setRecipes((prev) => (reset ? data : [...prev, ...data]));

        if (data.length < FEED_PAGE_SIZE) {
          setHasMore(false);
        } else {
          pageRef.current = reset ? 2 : pageRef.current + 1;
        }
      } catch (error) {
        console.error('Error fetching main recipes:', error);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [mealType, cuisine, searchQuery, dietaryNeeds]
  );

  // Reset feed when any filter changes
  useEffect(() => {
    fetchPage(true);
  }, [mealType, cuisine, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoadingInitial) return;
    fetchPage(false);
  }, [hasMore, isLoadingMore, isLoadingInitial, fetchPage]);

  return { recipes, isLoadingInitial, isLoadingMore, hasMore, loadMore };
}
