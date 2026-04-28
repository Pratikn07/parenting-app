import React from 'react';
import RecipeCard from '@/src/frontend/components/recipes/RecipeCard';
import RecipeSection from '@/src/frontend/components/recipes/RecipeSection';
import type { Recipe } from '@/src/lib/types/recipes';

interface PersonalizedSectionsProps {
  styleRecipes: Recipe[];
  ageRecipes: Recipe[];
  kitchenStyle: string[];
  childAgeMonths: number;
  savedIds: string[];
  onPressRecipe: (recipeId: string) => void;
  onToggleSave: (recipeId: string) => void;
}

export function PersonalizedSections({
  styleRecipes,
  ageRecipes,
  kitchenStyle,
  childAgeMonths,
  savedIds,
  onPressRecipe,
  onToggleSave,
}: PersonalizedSectionsProps) {
  if (styleRecipes.length === 0 && ageRecipes.length === 0) return null;

  return (
    <>
      {styleRecipes.length > 0 && (
        <RecipeSection
          title="Matches Your Style"
          subtitle={`Based on your ${kitchenStyle.join(' & ')} preference`}
        >
          {styleRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => onPressRecipe(recipe.id)}
              isSaved={savedIds.includes(recipe.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </RecipeSection>
      )}

      {ageRecipes.length > 0 && (
        <RecipeSection
          title={`Perfect for ${childAgeMonths}mo`}
          subtitle="Age-appropriate textures and nutrients"
        >
          {ageRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => onPressRecipe(recipe.id)}
              isSaved={savedIds.includes(recipe.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </RecipeSection>
      )}
    </>
  );
}
