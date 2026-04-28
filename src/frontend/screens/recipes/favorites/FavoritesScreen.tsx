import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { THEME } from '@/src/lib/constants';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';
import type { Recipe } from '@/src/lib/types/recipes';
import { FavoritesHeader } from './components/FavoritesHeader';
import { FavoritesStatsBar } from './components/FavoritesStatsBar';
import { FavoritesSearchSort } from './components/FavoritesSearchSort';
import { MealFilterChips } from './components/MealFilterChips';
import { FavoriteRecipeCard } from './components/FavoriteRecipeCard';
import { useFavoriteRecipes } from './hooks/useFavoriteRecipes';
import { useFavoritesFilter } from './hooks/useFavoritesFilter';

export default function FavoritesScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { recipes, isLoading, unsave } = useFavoriteRecipes({ userId: user?.id });
  const {
    searchQuery,
    setSearchQuery,
    mealFilter,
    setMealFilter,
    sortBy,
    cycleSort,
    filteredRecipes,
    hasActiveFilters,
    clearFilters,
  } = useFavoritesFilter(recipes);

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}` as never);
  };

  const confirmRemove = (recipe: Recipe) => {
    Alert.alert(
      'Remove from Favorites?',
      `Are you sure you want to remove "${recipe.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => unsave(recipe.id) },
      ]
    );
  };

  const showToolbar = !isLoading && recipes.length > 0;
  const showEmpty = !isLoading && recipes.length === 0;
  const showNoResults = !isLoading && recipes.length > 0 && filteredRecipes.length === 0;

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea}>
        <FavoritesHeader onBack={() => router.back()} />

        {showToolbar && (
          <>
            <FavoritesStatsBar
              visibleCount={filteredRecipes.length}
              totalCount={recipes.length}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
            <FavoritesSearchSort
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onCycleSort={cycleSort}
            />
            <MealFilterChips active={mealFilter} onChange={setMealFilter} />
          </>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
          )}

          {showEmpty && (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💝</Text>
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the heart on any recipe to save it here for quick access!
              </Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.back()}>
                <Text style={styles.exploreButtonText}>Explore Recipes</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {showNoResults && (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={styles.noResultsState}
            >
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsText}>
                {searchQuery
                  ? `No recipes match "${searchQuery}"`
                  : 'No recipes match these filters'}
              </Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearSearchText}>Clear all filters</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!isLoading && filteredRecipes.length > 0 && (
            <View style={styles.grid}>
              <Text style={styles.tipText}>💡 Long press to remove</Text>
              {filteredRecipes.map((recipe, index) => (
                <FavoriteRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  onPress={handleRecipePress}
                  onLongPress={confirmRemove}
                  onUnsave={unsave}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  loadingState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.ui.white,
  },
  noResultsState: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  clearSearchText: {
    fontSize: 15,
    fontFamily: THEME.fonts.bodyMedium,
    color: THEME.colors.primary,
  },
  grid: {
    gap: 16,
  },
  tipText: {
    fontSize: 13,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
