import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, Layout, SlideOutRight } from 'react-native-reanimated';
import RecipeCard from '@/src/frontend/components/recipes/RecipeCard';
import type { Recipe } from '@/src/lib/types/recipes';

interface FavoriteRecipeCardProps {
  recipe: Recipe;
  index: number;
  onPress: (recipeId: string) => void;
  onLongPress: (recipe: Recipe) => void;
  onUnsave: (recipeId: string) => void;
}

export function FavoriteRecipeCard({
  recipe,
  index,
  onPress,
  onLongPress,
  onUnsave,
}: FavoriteRecipeCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      exiting={SlideOutRight.duration(300)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        onPress={() => onPress(recipe.id)}
        onLongPress={() => onLongPress(recipe)}
        delayLongPress={500}
        activeOpacity={0.95}
      >
        <RecipeCard
          recipe={recipe}
          variant="vertical"
          onPress={() => onPress(recipe.id)}
          isSaved={true}
          onToggleSave={onUnsave}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
