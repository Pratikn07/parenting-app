import { useEffect, useState } from 'react';
import {
  getRecipeById,
  getSavedRecipeIds,
  saveRecipe,
  unsaveRecipe,
} from '@/src/services/recipeService';
import type { Recipe } from '@/src/lib/types/recipes';

interface UseRecipeDataParams {
  recipeId: string | string[] | undefined;
  userId: string | undefined;
}

interface UseRecipeDataResult {
  recipe: Recipe | null;
  isLoading: boolean;
  isSaved: boolean;
  toggleSave: () => Promise<void>;
}

export function useRecipeData({ recipeId, userId }: UseRecipeDataParams): UseRecipeDataResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (typeof recipeId !== 'string') return;
      setIsLoading(true);
      const [data, savedIds] = await Promise.all([
        getRecipeById(recipeId),
        userId ? getSavedRecipeIds(userId) : Promise.resolve([]),
      ]);
      setRecipe(data);
      if (data && savedIds.includes(data.id)) {
        setIsSaved(true);
      }
      setIsLoading(false);
    };
    fetchRecipe();
  }, [recipeId, userId]);

  const toggleSave = async () => {
    if (!userId || !recipe) return;
    const previousState = isSaved;
    setIsSaved(!isSaved);
    try {
      if (previousState) {
        await unsaveRecipe(userId, recipe.id);
      } else {
        await saveRecipe(userId, recipe.id);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setIsSaved(previousState);
    }
  };

  return { recipe, isLoading, isSaved, toggleSave };
}
