import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSavedRecipeIds, saveRecipe, unsaveRecipe } from '@/src/services/recipeService';

interface UseSavedRecipesResult {
  savedIds: string[];
  toggleSave: (recipeId: string) => Promise<void>;
}

export function useSavedRecipes(userId: string | undefined): UseSavedRecipesResult {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Refresh on focus to stay in sync with Favorites screen
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        getSavedRecipeIds(userId).then(setSavedIds);
      }
    }, [userId])
  );

  const toggleSave = useCallback(
    async (recipeId: string) => {
      if (!userId) return;

      const isSaved = savedIds.includes(recipeId);
      const nextIds = isSaved
        ? savedIds.filter((id) => id !== recipeId)
        : [...savedIds, recipeId];

      setSavedIds(nextIds);

      try {
        if (isSaved) {
          await unsaveRecipe(userId, recipeId);
        } else {
          await saveRecipe(userId, recipeId);
        }
      } catch (error) {
        console.error('Error saving/unsaving:', error);
        setSavedIds(savedIds);
      }
    },
    [userId, savedIds]
  );

  return { savedIds, toggleSave };
}
