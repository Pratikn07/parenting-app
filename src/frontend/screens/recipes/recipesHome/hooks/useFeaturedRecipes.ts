import { useEffect, useState } from 'react';
import { getFilteredRecipes } from '@/src/services/recipeService';
import type { Recipe } from '@/src/lib/types/recipes';
import { FEATURED_LIMIT } from '../constants';

interface UseFeaturedRecipesParams {
  kitchenStyle: string[];
  childAgeMonths: number;
}

interface UseFeaturedRecipesResult {
  styleRecipes: Recipe[];
  ageRecipes: Recipe[];
}

const AGE_LOOKBACK_MONTHS = 6;

export function useFeaturedRecipes({
  kitchenStyle,
  childAgeMonths,
}: UseFeaturedRecipesParams): UseFeaturedRecipesResult {
  const [styleRecipes, setStyleRecipes] = useState<Recipe[]>([]);
  const [ageRecipes, setAgeRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        if (kitchenStyle.length > 0) {
          const styles = await getFilteredRecipes({
            kitchenStyleTags: kitchenStyle,
            limit: FEATURED_LIMIT,
          });
          setStyleRecipes(styles);
        }

        const ageMatches = await getFilteredRecipes({
          minAge: Math.max(0, childAgeMonths - AGE_LOOKBACK_MONTHS),
          limit: FEATURED_LIMIT,
          page: 1,
        });
        setAgeRecipes(ageMatches);
      } catch (err) {
        console.error('Error fetching featured recipes', err);
      }
    };
    fetchFeatured();
  }, [kitchenStyle, childAgeMonths]);

  return { styleRecipes, ageRecipes };
}
