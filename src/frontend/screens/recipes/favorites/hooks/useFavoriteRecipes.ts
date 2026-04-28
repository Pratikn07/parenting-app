import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSavedRecipes, unsaveRecipe } from '@/src/services/recipeService';
import type { Recipe } from '@/src/lib/types/recipes';

interface UseFavoriteRecipesParams {
  userId: string | undefined;
}

interface UseFavoriteRecipesResult {
  recipes: Recipe[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  unsave: (recipeId: string) => Promise<void>;
}

export function useFavoriteRecipes({
  userId,
}: UseFavoriteRecipesParams): UseFavoriteRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getSavedRecipes(userId);
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const unsave = useCallback(
    async (recipeId: string) => {
      if (!userId) return;
      const previous = recipes;
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));

      try {
        await unsaveRecipe(userId, recipeId);
      } catch (error) {
        console.error('Error removing favorite:', error);
        setRecipes(previous);
      }
    },
    [userId, recipes]
  );

  return { recipes, isLoading, refetch, unsave };
}
