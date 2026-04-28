import { useCallback, useMemo, useState } from 'react';
import type { Recipe } from '@/src/lib/types/recipes';
import { MealFilter, SORT_CYCLE, SortOption } from '../constants';

interface UseFavoritesFilterResult {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mealFilter: MealFilter;
  setMealFilter: (m: MealFilter) => void;
  sortBy: SortOption;
  cycleSort: () => void;
  filteredRecipes: Recipe[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

function matchesSearch(recipe: Recipe, query: string): boolean {
  const q = query.toLowerCase();
  if (recipe.title.toLowerCase().includes(q)) return true;
  return recipe.ingredients?.some((ing) => (ing?.item || '').toLowerCase().includes(q)) ?? false;
}

function matchesMealType(recipe: Recipe, meal: MealFilter): boolean {
  if (meal === 'all') return true;
  return recipe.mealTypes?.some((mt) => mt.toLowerCase() === meal) ?? false;
}

function applySort(recipes: Recipe[], sortBy: SortOption): Recipe[] {
  switch (sortBy) {
    case 'alphabetical':
      return [...recipes].sort((a, b) => a.title.localeCompare(b.title));
    case 'rating':
      return [...recipes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'recent':
    default:
      return recipes;
  }
}

export function useFavoritesFilter(recipes: Recipe[]): UseFavoritesFilterResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const cycleSort = useCallback(() => {
    setSortBy((current) => {
      const idx = SORT_CYCLE.indexOf(current);
      return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    });
  }, []);

  const filteredRecipes = useMemo(() => {
    const trimmed = searchQuery.trim();
    const filtered = recipes.filter(
      (r) => (!trimmed || matchesSearch(r, trimmed)) && matchesMealType(r, mealFilter)
    );
    return applySort(filtered, sortBy);
  }, [recipes, searchQuery, sortBy, mealFilter]);

  const hasActiveFilters = mealFilter !== 'all';

  const clearFilters = useCallback(() => {
    setMealFilter('all');
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    mealFilter,
    setMealFilter,
    sortBy,
    cycleSort,
    filteredRecipes,
    hasActiveFilters,
    clearFilters,
  };
}
