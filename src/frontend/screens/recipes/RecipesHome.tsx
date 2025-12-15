import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bookmark, SlidersHorizontal, ChevronDown } from 'lucide-react-native'; // Added ChevronDown for Load More
import { useRouter } from 'expo-router';
import { THEME } from '@/src/lib/constants';
import { useRecipeOnboardingStore } from '@/src/shared/stores/recipeStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';

import { getFilteredRecipes, getSavedRecipeIds, saveRecipe, unsaveRecipe, getTrendingSearches, logSearchQuery } from '@/src/services/recipeService';
import { getRecentSearches, addRecentSearch, clearRecentSearches, removeRecentSearch } from '@/src/services/searchHistoryService';
import RecipeCard from '@/src/frontend/components/recipes/RecipeCard';
import CuisineFilter from '@/src/frontend/components/recipes/CuisineFilter';
import RecipeSection from '@/src/frontend/components/recipes/RecipeSection';
import RecipeFilterModal from '@/src/frontend/components/recipes/RecipeFilterModal';
import SearchSuggestionsDropdown from '@/src/frontend/components/recipes/SearchSuggestionsDropdown';
import { Recipe } from '@/src/lib/types/recipes';

const MEAL_OPTIONS = [
    { id: 'all', label: 'All Meals', emoji: '🍽️' },
    { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
    { id: 'lunch', label: 'Lunch', emoji: '🥪' },
    { id: 'dinner', label: 'Dinner', emoji: '🥘' },
    { id: 'snack', label: 'Snacks', emoji: '🍎' },
];

const CUISINE_OPTIONS = [
    { id: 'all', label: 'All Cuisines', emoji: '🌍' },
    { id: 'italian', label: 'Italian', emoji: '🍝' },
    { id: 'mexican', label: 'Mexican', emoji: '🌮' },
    { id: 'indian', label: 'Indian', emoji: '🍛' },
    { id: 'asian', label: 'Asian', emoji: '🥢' },
    { id: 'american', label: 'American', emoji: '🍔' },
];

export default function RecipesHome() {
    const { preferences } = useRecipeOnboardingStore();
    const { activeChild } = useChildStore();
    const { user } = useAuthStore();
    const router = useRouter();

    // Data State
    const [mainRecipes, setMainRecipes] = useState<Recipe[]>([]);
    const [styleRecipes, setStyleRecipes] = useState<Recipe[]>([]);
    const [ageRecipes, setAgeRecipes] = useState<Recipe[]>([]);
    const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);

    // Loading State
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Filter State
    const [selectedMeal, setSelectedMeal] = useState('all');
    const [selectedCuisine, setSelectedCuisine] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);

    // Search Suggestions State
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

    // Derived Logic

    const hasActiveFilters = selectedMeal !== 'all' || selectedCuisine !== 'all' || searchQuery.length > 0;

    // Fetch saved IDs on focus (to keep in sync with Favorites screen)
    useFocusEffect(
        useCallback(() => {
            if (user) {
                getSavedRecipeIds(user.id).then(setSavedRecipeIds);
            }
        }, [user])
    );

    // Load recent searches and trending searches on mount
    useEffect(() => {
        getRecentSearches().then(setRecentSearches);
        getTrendingSearches().then(setTrendingSearches);
    }, []);

    const handleToggleSave = async (recipeId: string) => {
        if (!user) return;

        const isSaved = savedRecipeIds.includes(recipeId);
        const newSavedIds = isSaved
            ? savedRecipeIds.filter(id => id !== recipeId)
            : [...savedRecipeIds, recipeId];

        // Optimistic update
        setSavedRecipeIds(newSavedIds); // Update hearts

        try {
            if (isSaved) {
                await unsaveRecipe(user.id, recipeId);
            } else {
                await saveRecipe(user.id, recipeId);
            }
        } catch (error) {
            console.error('Error saving/unsaving:', error);
            // Revert on error could be added here
        }
    };

    const handleNavigateToFavorites = () => {
        router.push('/recipes/favorites' as any);
    };

    const handleSearchSelect = async (query: string) => {
        setSearchQuery(query);
        setIsSearchFocused(false);
        await addRecentSearch(query);
        const updated = await getRecentSearches();
        setRecentSearches(updated);
    };

    const handleClearSearchHistory = async () => {
        await clearRecentSearches();
        setRecentSearches([]);
    };

    const handleRemoveSearchItem = async (query: string) => {
        await removeRecentSearch(query);
        const updated = await getRecentSearches();
        setRecentSearches(updated);
    };

    const handleSearchSubmit = async () => {
        if (searchQuery.trim()) {
            await addRecentSearch(searchQuery);
            const updated = await getRecentSearches();
            setRecentSearches(updated);
            setIsSearchFocused(false);

            // Log search for trending analytics
            if (user) {
                await logSearchQuery(user.id, searchQuery);
            }
        }
    };

    // Calculate Child Age (used for filtering)
    const childAgeMonths = useMemo(() => {
        if (!activeChild?.birth_date) return 12;
        const birthDate = new Date(activeChild.birth_date);
        const now = new Date();
        return Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    }, [activeChild]);

    // 1. Fetch Featured Sections (Style & Age) - Run ONCE on mount (or when profile changes)
    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch Style Matches
                if (preferences.kitchenStyle.length > 0) {
                    const styles = await getFilteredRecipes({
                        kitchenStyleTags: preferences.kitchenStyle,
                        limit: 5
                    });
                    setStyleRecipes(styles);
                }

                // Fetch Age Matches (recipes appropriate for age)
                const ageMatches = await getFilteredRecipes({
                    minAge: Math.max(0, childAgeMonths - 6),
                    // We interpret "Perfect for X" as appropriate for "X" (so minAge <= X)
                    // Logic: recipes where minAge is close.
                    // Or simpler: just recipes valid for this age.
                    // Let's use strict: valid for this age, sorted by rating.
                    limit: 5,
                    page: 1
                });
                setAgeRecipes(ageMatches);

            } catch (err) {
                console.error("Error fetching featured recipes", err);
            }
        };
        fetchFeatured();
    }, [preferences.kitchenStyle, childAgeMonths]);


    // 2. Fetch Main Feed (Dependent on Filters)
    const fetchMainFeed = useCallback(async (reset = false) => {
        if (reset) {
            setIsLoadingInitial(true);
            setPage(1);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }

        const currentPage = reset ? 1 : page;

        try {
            const data = await getFilteredRecipes({
                page: currentPage,
                limit: 10,
                mealType: selectedMeal,
                cuisine: selectedCuisine,
                searchQuery: searchQuery,
                dietaryNeeds: preferences.dietaryNeeds, // Always apply dietary needs
            });

            if (reset) {
                setMainRecipes(data);
            } else {
                setMainRecipes(prev => [...prev, ...data]);
            }

            if (data.length < 10) {
                setHasMore(false);
            } else {
                // Prepare next page
                if (!reset) setPage(p => p + 1);
                else setPage(2);
            }

        } catch (error) {
            console.error('Error fetching main recipes:', error);
        } finally {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        }
    }, [selectedMeal, selectedCuisine, searchQuery, preferences.dietaryNeeds, page]);

    // Trigger fetch when filters change
    useEffect(() => {
        fetchMainFeed(true);
    }, [selectedMeal, selectedCuisine, searchQuery]); // Deps meant to trigger reset

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore || isLoadingInitial) return;
        fetchMainFeed(false);
    };

    const handleRecipePress = (recipeId: string) => {
        router.push(`/recipe/${recipeId}` as any);
    };

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    return (
        <View style={styles.container}>
            <ScreenBackground />
            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0] || 'Parent'}!</Text>
                        <Text style={styles.subtext}>
                            Cooking for <Text style={styles.childName}>{activeChild?.name || 'your little one'}</Text>
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.savedButton}
                        onPress={handleNavigateToFavorites}
                    >
                        <Bookmark size={24} color={THEME.colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color={THEME.colors.text.secondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search recipes, ingredients..."
                            placeholderTextColor={THEME.colors.text.secondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                        />
                    </View>

                    {/* Search Suggestions Dropdown */}
                    <SearchSuggestionsDropdown
                        visible={isSearchFocused}
                        recentSearches={recentSearches}
                        trendingSearches={trendingSearches}
                        onSelectSearch={handleSearchSelect}
                        onClearHistory={handleClearSearchHistory}
                        onRemoveRecent={handleRemoveSearchItem}
                    />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Smart Filter Bar */}
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                selectedCuisine !== 'all' && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <SlidersHorizontal
                                size={20}
                                color={selectedCuisine !== 'all' ? THEME.colors.ui.white : THEME.colors.text.primary}
                            />
                            {selectedCuisine !== 'all' && (
                                <View style={styles.badge} />
                            )}
                        </TouchableOpacity>

                        <View style={styles.verticalDivider} />

                        <View style={styles.pillsContainer}>
                            <CuisineFilter
                                options={MEAL_OPTIONS}
                                selectedId={selectedMeal}
                                onSelect={setSelectedMeal}
                                containerStyle={{ marginBottom: 0 }}
                                contentContainerStyle={{ paddingHorizontal: 0, paddingRight: 24 }}
                            />
                        </View>
                    </View>

                    {/* LOADING STATE - Only for initial load */}
                    {isLoadingInitial && mainRecipes.length === 0 ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color={THEME.colors.primary} />
                            <Text style={styles.loadingText}>Loading recipes...</Text>
                        </View>
                    ) : mainRecipes.length === 0 && !isLoadingInitial ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {searchQuery || selectedMeal !== 'all'
                                    ? "No recipes found matching your filters."
                                    : "No recipes available."}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Personalized Sections: Only show if NO filters active */}
                            {!hasActiveFilters && (
                                <>
                                    {styleRecipes.length > 0 && (
                                        <RecipeSection
                                            title="Matches Your Style"
                                            subtitle={`Based on your ${preferences.kitchenStyle.join(' & ')} preference`}
                                        >
                                            {styleRecipes.map(recipe => (
                                                <RecipeCard
                                                    key={recipe.id}
                                                    recipe={recipe}
                                                    onPress={() => handleRecipePress(recipe.id)}
                                                    isSaved={savedRecipeIds.includes(recipe.id)}
                                                    onToggleSave={handleToggleSave}
                                                />
                                            ))}
                                        </RecipeSection>
                                    )}

                                    {ageRecipes.length > 0 && (
                                        <RecipeSection
                                            title={`Perfect for ${childAgeMonths}mo`}
                                            subtitle="Age-appropriate textures and nutrients"
                                        >
                                            {ageRecipes.map(recipe => (
                                                <RecipeCard
                                                    key={recipe.id}
                                                    recipe={recipe}
                                                    onPress={() => handleRecipePress(recipe.id)}
                                                    isSaved={savedRecipeIds.includes(recipe.id)}
                                                    onToggleSave={handleToggleSave}
                                                />
                                            ))}
                                        </RecipeSection>
                                    )}
                                </>
                            )}

                            {/* Main Feed */}
                            <View style={styles.mainFeed}>
                                <Text style={styles.sectionTitle}>
                                    {hasActiveFilters ? 'Filtered Results' : 'Explore All'}
                                </Text>
                                {mainRecipes.map(recipe => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        variant="vertical"
                                        onPress={() => handleRecipePress(recipe.id)}
                                        isSaved={savedRecipeIds.includes(recipe.id)}
                                        onToggleSave={handleToggleSave}
                                    />
                                ))}

                                {/* Load More Button */}
                                {hasMore && (
                                    <View style={styles.loadMoreContainer}>
                                        <TouchableOpacity
                                            style={styles.loadMoreButton}
                                            onPress={handleLoadMore}
                                            disabled={isLoadingMore}
                                        >
                                            {isLoadingMore ? (
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
                onClose={() => setFilterModalVisible(false)}
                cuisineOptions={CUISINE_OPTIONS}
                selectedCuisine={selectedCuisine}
                onSelectCuisine={setSelectedCuisine}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 24,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    subtext: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    childName: {
        color: THEME.colors.primary,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    savedButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: THEME.colors.ui.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.ui.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    filterRow: {
        paddingHorizontal: 24,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center', // This ensures vertical centering
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22, // Make it circular to match pills better visually
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterButtonActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: THEME.colors.ui.border,
        marginHorizontal: 12,
    },
    pillsContainer: {
        flex: 1,
        // The previous negative margin might be causing issues if the child ScrollView has padding.
        // Let's remove the negative margin and handle layout better.
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: THEME.colors.secondary,
        borderWidth: 2,
        borderColor: THEME.colors.background,
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
