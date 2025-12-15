import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, Clock, SortAsc, ArrowUpDown, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, Layout, SlideOutRight } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { THEME } from '@/src/lib/constants';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';
import { getSavedRecipes, unsaveRecipe } from '@/src/services/recipeService';
import RecipeCard from '@/src/frontend/components/recipes/RecipeCard';
import { Recipe } from '@/src/lib/types/recipes';

type SortOption = 'recent' | 'alphabetical' | 'rating';
type MealFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_FILTERS = [
    { id: 'all' as MealFilter, label: 'All', emoji: '🍽️' },
    { id: 'breakfast' as MealFilter, label: 'Breakfast', emoji: '🍳' },
    { id: 'lunch' as MealFilter, label: 'Lunch', emoji: '🥪' },
    { id: 'dinner' as MealFilter, label: 'Dinner', emoji: '🥘' },
    { id: 'snack' as MealFilter, label: 'Snacks', emoji: '🍎' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function FavoritesScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [mealFilter, setMealFilter] = useState<MealFilter>('all');

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getSavedRecipes(user.id);
            setRecipes(data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchFavorites();
        }, [fetchFavorites])
    );

    // Filter and sort recipes
    const filteredRecipes = useMemo(() => {
        let result = [...recipes];


        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(recipe =>
                recipe.title.toLowerCase().includes(query) ||
                recipe.ingredients?.some(ing =>
                    (typeof ing === 'string' ? ing : ing.item)?.toLowerCase().includes(query)
                )
            );
        }

        // Filter by meal type
        if (mealFilter !== 'all') {
            result = result.filter(recipe =>
                recipe.mealTypes?.some(mt => mt.toLowerCase() === mealFilter)
            );
        }

        // Sort
        switch (sortBy) {
            case 'alphabetical':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'recent':
            default:
                break;
        }

        return result;
    }, [recipes, searchQuery, sortBy, mealFilter]);

    const handleUnsave = async (recipeId: string) => {
        if (!user) return;
        setRecipes(prev => prev.filter(r => r.id !== recipeId));

        try {
            await unsaveRecipe(user.id, recipeId);
        } catch (error) {
            console.error('Error removing favorite:', error);
            fetchFavorites();
        }
    };

    const confirmRemove = (recipe: Recipe) => {
        Alert.alert(
            'Remove from Favorites?',
            `Are you sure you want to remove "${recipe.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => handleUnsave(recipe.id) }
            ]
        );
    };

    const handleRecipePress = (recipeId: string) => {
        router.push(`/recipe/${recipeId}` as any);
    };

    const handleExploreRecipes = () => {
        router.back();
    };

    const cycleSortOption = () => {
        const options: SortOption[] = ['recent', 'alphabetical', 'rating'];
        const currentIndex = options.indexOf(sortBy);
        const nextIndex = (currentIndex + 1) % options.length;
        setSortBy(options[nextIndex]);
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'recent': return 'Recent';
            case 'alphabetical': return 'A-Z';
            case 'rating': return 'Rating';
        }
    };

    const getSortIcon = () => {
        switch (sortBy) {
            case 'recent': return Clock;
            case 'alphabetical': return SortAsc;
            case 'rating': return ArrowUpDown;
        }
    };

    const hasActiveFilters = mealFilter !== 'all';

    const clearFilters = () => {
        setMealFilter('all');
        setSearchQuery('');
    };

    const SortIcon = getSortIcon();

    // Animated Recipe Card Component
    const AnimatedRecipeCard = ({ recipe, index }: { recipe: Recipe; index: number }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                exiting={SlideOutRight.duration(300)}
                layout={Layout.springify()}
            >
                <TouchableOpacity
                    onPress={() => handleRecipePress(recipe.id)}
                    onLongPress={() => confirmRemove(recipe)}
                    delayLongPress={500}
                    activeOpacity={0.95}
                >
                    <RecipeCard
                        recipe={recipe}
                        variant="vertical"
                        onPress={() => handleRecipePress(recipe.id)}
                        isSaved={true}
                        onToggleSave={handleUnsave}
                    />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <ScreenBackground />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View
                    entering={FadeInDown.delay(0).springify()}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={THEME.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Favorites</Text>
                    <View style={styles.placeholder} />
                </Animated.View>

                {/* Stats Bar */}
                {!loading && recipes.length > 0 && (
                    <Animated.View
                        entering={FadeInDown.delay(50).springify()}
                        style={styles.statsBar}
                    >
                        <Text style={styles.recipeCount}>
                            {filteredRecipes.length} of {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
                        </Text>
                        {hasActiveFilters && (
                            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                                <X size={14} color={THEME.colors.primary} />
                                <Text style={styles.clearFiltersText}>Clear filters</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {/* Search & Sort Bar */}
                {!loading && recipes.length > 0 && (
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.searchSortBar}
                    >
                        <View style={styles.searchBar}>
                            <Search size={18} color={THEME.colors.text.secondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search favorites..."
                                placeholderTextColor={THEME.colors.text.secondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity style={styles.sortButton} onPress={cycleSortOption}>
                            <SortIcon size={16} color={THEME.colors.primary} />
                            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Filter Chips */}
                {!loading && recipes.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(150).springify()}>
                        {/* Meal Type Filters */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterChipsContainer}
                        >
                            {MEAL_FILTERS.map((filter, index) => (
                                <AnimatedTouchable
                                    key={filter.id}
                                    entering={FadeInRight.delay(index * 50)}
                                    style={[
                                        styles.filterChip,
                                        mealFilter === filter.id && styles.filterChipActive
                                    ]}
                                    onPress={() => setMealFilter(filter.id)}
                                >
                                    <Text style={styles.filterChipEmoji}>{filter.emoji}</Text>
                                    <Text style={[
                                        styles.filterChipText,
                                        mealFilter === filter.id && styles.filterChipTextActive
                                    ]}>
                                        {filter.label}
                                    </Text>
                                </AnimatedTouchable>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* Content */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color={THEME.colors.primary} />
                        </View>
                    ) : recipes.length === 0 ? (
                        <Animated.View
                            entering={FadeInDown.delay(100).springify()}
                            style={styles.emptyState}
                        >
                            <Text style={styles.emptyIcon}>💝</Text>
                            <Text style={styles.emptyTitle}>No favorites yet</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the heart on any recipe to save it here for quick access!
                            </Text>
                            <TouchableOpacity style={styles.exploreButton} onPress={handleExploreRecipes}>
                                <Text style={styles.exploreButtonText}>Explore Recipes</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : filteredRecipes.length === 0 ? (
                        <Animated.View
                            entering={FadeInDown.delay(100).springify()}
                            style={styles.noResultsState}
                        >
                            <Text style={styles.noResultsIcon}>🔍</Text>
                            <Text style={styles.noResultsText}>
                                {searchQuery ? `No recipes match "${searchQuery}"` : 'No recipes match these filters'}
                            </Text>
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.clearSearchText}>Clear all filters</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.grid}>
                            <Text style={styles.tipText}>💡 Long press to remove</Text>
                            {filteredRecipes.map((recipe, index) => (
                                <AnimatedRecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    index={index}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    recipeCount: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.secondary,
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearFiltersText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.primary,
    },
    searchSortBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        padding: 0,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    sortButtonText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.primary,
    },
    filterChipsContainer: {
        paddingHorizontal: 24,
        gap: 8,
        paddingVertical: 6,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    filterChipActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    filterChipEmoji: {
        fontSize: 14,
    },
    filterChipText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.secondary,
    },
    filterChipTextActive: {
        color: THEME.colors.ui.white,
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
