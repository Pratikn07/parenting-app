import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';

import { THEME } from '@/src/lib/constants';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { useRecipeOnboardingStore } from '@/src/shared/stores/recipeStore';
import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';
import RecipeCard from '@/src/frontend/components/recipes/RecipeCard';
import RecipeFilterModal from '@/src/frontend/components/recipes/RecipeFilterModal';

import { CUISINE_OPTIONS, MEAL_OPTIONS } from './constants';
import { getChildAgeMonths, getGreeting } from './utils';
import { useFeaturedRecipes } from './hooks/useFeaturedRecipes';
import { useRecipeFeed } from './hooks/useRecipeFeed';
import { useSavedRecipes } from './hooks/useSavedRecipes';
import { useSearchSuggestions } from './hooks/useSearchSuggestions';
import { PersonalizedSections } from './components/PersonalizedSections';
import { RecipesFilterRow } from './components/RecipesFilterRow';
import { RecipesHeader } from './components/RecipesHeader';
import { RecipesSearchBar } from './components/RecipesSearchBar';

export default function RecipesHome() {
  const { preferences } = useRecipeOnboardingStore();
  const { activeChild } = useChildStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [selectedMeal, setSelectedMeal] = useState('all');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const childAgeMonths = useMemo(
    () => getChildAgeMonths(activeChild?.birth_date),
    [activeChild?.birth_date]
  );
  const greeting = useMemo(() => getGreeting(), []);
  const hasActiveFilters =
    selectedMeal !== 'all' || selectedCuisine !== 'all' || searchQuery.length > 0;
  const userName = user?.name?.split(' ')[0] || 'Parent';
  const childName = activeChild?.name || 'your little one';

  const { savedIds, toggleSave } = useSavedRecipes(user?.id);

  const search = useSearchSuggestions();

  const { styleRecipes, ageRecipes } = useFeaturedRecipes({
    kitchenStyle: preferences.kitchenStyle,
    childAgeMonths,
  });

  const feed = useRecipeFeed({
    mealType: selectedMeal,
    cuisine: selectedCuisine,
    searchQuery,
    dietaryNeeds: preferences.dietaryNeeds,
  });

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    await search.recordRecent(searchQuery);
    if (user) {
      await search.logSearch(user.id, searchQuery);
    }
  };

  const handleSearchSelect = async (selected: string) => {
    setSearchQuery(selected);
    await search.recordRecent(selected);
  };

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}` as never);
  };

  const handleNavigateToFavorites = () => {
    router.push('/recipes/favorites' as never);
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea}>
        <RecipesHeader
          greeting={greeting}
          userName={userName}
          childName={childName}
          onSavedPress={handleNavigateToFavorites}
        />

        <RecipesSearchBar
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          onSubmit={handleSearchSubmit}
          recentSearches={search.recentSearches}
          trendingSearches={search.trendingSearches}
          onSelectSearch={handleSearchSelect}
          onClearHistory={search.clearHistory}
          onRemoveRecent={search.removeRecent}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <RecipesFilterRow
            mealOptions={MEAL_OPTIONS}
            selectedMeal={selectedMeal}
            onSelectMeal={setSelectedMeal}
            hasCuisineFilter={selectedCuisine !== 'all'}
            onPressFilter={() => setIsFilterModalVisible(true)}
          />

          {feed.isLoadingInitial && feed.recipes.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : feed.recipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {hasActiveFilters
                  ? 'No recipes found matching your filters.'
                  : 'No recipes available.'}
              </Text>
            </View>
          ) : (
            <>
              {!hasActiveFilters && (
                <PersonalizedSections
                  styleRecipes={styleRecipes}
                  ageRecipes={ageRecipes}
                  kitchenStyle={preferences.kitchenStyle}
                  childAgeMonths={childAgeMonths}
                  savedIds={savedIds}
                  onPressRecipe={handleRecipePress}
                  onToggleSave={toggleSave}
                />
              )}

              <View style={styles.mainFeed}>
                <Text style={styles.sectionTitle}>
                  {hasActiveFilters ? 'Filtered Results' : 'Explore All'}
                </Text>
                {feed.recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    variant="vertical"
                    onPress={() => handleRecipePress(recipe.id)}
                    isSaved={savedIds.includes(recipe.id)}
                    onToggleSave={toggleSave}
                  />
                ))}

                {feed.hasMore && (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={feed.loadMore}
                      disabled={feed.isLoadingMore}
                    >
                      {feed.isLoadingMore ? (
                        <ActivityIndicator size="small" color={THEME.colors.ui.white} />
                      ) : (
                        <>
                          <Text style={styles.loadMoreText}>Load More</Text>
                          <ChevronDown size={16} color={THEME.colors.ui.white} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <RecipeFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        cuisineOptions={CUISINE_OPTIONS}
        selectedCuisine={selectedCuisine}
        onSelectCuisine={setSelectedCuisine}
      />
    </View>
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
    paddingBottom: 100,
  },
  mainFeed: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  loadingState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 16,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.ui.white,
  },
});
