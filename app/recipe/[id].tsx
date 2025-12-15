import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AlertCircle, ArrowLeft, Clock, Flame, Share2, Heart, ChefHat, AlertTriangle, Refrigerator, RefreshCw } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/src/lib/constants';
import { getRecipeById, saveRecipe, unsaveRecipe, getSavedRecipeIds } from '@/src/services/recipeService';
import { Recipe } from '@/src/lib/types/recipes';
import { RecipeAssistantSheet } from '@/src/frontend/components/recipes/RecipeAssistantSheet';
import { useAuthStore } from '@/src/shared/stores/authStore';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

// Allergen display names
const ALLERGEN_LABELS: Record<string, string> = {
    milk: '🥛 Milk',
    eggs: '🥚 Eggs',
    wheat: '🌾 Wheat',
    soy: '🫘 Soy',
    peanuts: '🥜 Peanuts',
    tree_nuts: '🌰 Tree Nuts',
    fish: '🐟 Fish',
    shellfish: '🦐 Shellfish',
    sesame: '🌱 Sesame',
};

// Dynamic recipe tag helper
const getRecipeTag = (recipe: Recipe): string | null => {
    // Priority 1: Feeding type (most relevant)
    const feedingTypeLabels: Record<string, string> = {
        pregnancyNutrition: 'Pregnancy Nutrition',
        babyPurees: 'Baby Purées',
        fingerFoods: 'Baby-Led Weaning',
        toddlerMeals: 'Toddler Meals',
        familyDinners: 'Family Dinners',
        lunchboxIdeas: 'Lunchbox Ideas',
        treatsSnacks: 'Treats & Snacks',
    };

    if (recipe.feedingTypes && recipe.feedingTypes.length > 0) {
        const firstType = recipe.feedingTypes[0];
        return feedingTypeLabels[firstType] || null;
    }

    // Priority 2: Kitchen style
    const kitchenStyleLabels: Record<string, string> = {
        quick: 'Quick & Easy',
        confident: 'Chef Approved',
        batch: 'Batch Cooking',
        picky: 'Picky Eater Friendly',
        treats: 'Special Treats',
    };

    if (recipe.kitchenStyleTags && recipe.kitchenStyleTags.length > 0) {
        const firstStyle = recipe.kitchenStyleTags[0];
        return kitchenStyleLabels[firstStyle] || null;
    }

    return null;
};

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { user } = useAuthStore();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);
    const [assistantMode, setAssistantMode] = useState<'ingredient' | 'progress'>('ingredient');

    // FAB state
    const [showProgressFAB, setShowProgressFAB] = useState(false);
    const [preparationSectionY, setPreparationSectionY] = useState(0);
    const [fabFadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        const fetchRecipe = async () => {
            if (typeof id === 'string') {
                setIsLoading(true);
                const [data, savedIds] = await Promise.all([
                    getRecipeById(id),
                    user ? getSavedRecipeIds(user.id) : Promise.resolve([])
                ]);

                setRecipe(data);
                if (data && savedIds.includes(data.id)) {
                    setIsSaved(true);
                }
                setIsLoading(false);
            }
        };
        fetchRecipe();
    }, [id, user]);

    const handleToggleSave = async () => {
        if (!user || !recipe) return;

        const previousState = isSaved;
        setIsSaved(!isSaved); // Optimistic

        try {
            if (previousState) {
                await unsaveRecipe(user.id, recipe.id);
            } else {
                await saveRecipe(user.id, recipe.id);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            setIsSaved(previousState); // Revert
        }
    };

    // Scroll handler for FAB visibility
    const handleScroll = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const shouldShow = scrollY >= preparationSectionY - 100; // Show 100px before Preparation section

        if (shouldShow !== showProgressFAB) {
            setShowProgressFAB(shouldShow);
            Animated.timing(fabFadeAnim, {
                toValue: shouldShow ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    const openAssistant = (mode: 'ingredient' | 'progress') => {
        setAssistantMode(mode);
        setShowAssistant(true);
    };

    const closeAssistant = () => {
        setShowAssistant(false);
        // Reset mode to default after closing
        setTimeout(() => setAssistantMode('ingredient'), 300);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>Loading recipe...</Text>
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={styles.errorContainer}>
                <AlertCircle size={48} color={THEME.colors.text.secondary} />
                <Text style={styles.errorText}>Recipe not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonGeneric}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                bounces={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Hero Image Section */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />

                    {/* Header Overlay Gradient could go here */}
                    <View style={styles.imageOverlay} />

                    {/* Top Actions */}
                    <View style={[styles.topBar, { top: insets.top }]}>
                        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
                            <ArrowLeft size={24} color={THEME.colors.text.primary} />
                        </TouchableOpacity>
                        <View style={styles.topRightButtons}>
                            <TouchableOpacity style={[styles.circleButton, { marginRight: 12 }]}>
                                <Share2 size={22} color={THEME.colors.text.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.circleButton} onPress={handleToggleSave}>
                                <Heart
                                    size={22}
                                    color={isSaved ? THEME.colors.primary : THEME.colors.text.primary}
                                    fill={isSaved ? THEME.colors.primary : 'transparent'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Content Body */}
                <View style={styles.contentContainer}>
                    {/* Title & Meta */}
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>{recipe.title}</Text>
                        {getRecipeTag(recipe) && (
                            <View style={styles.tagBadge}>
                                <Text style={styles.tagText}>{getRecipeTag(recipe)}</Text>
                            </View>
                        )}

                        {/* Meta Row */}
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Clock size={16} color={THEME.colors.text.secondary} />
                                <Text style={styles.metaText}>{recipe.timeMinutes} min</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.metaItem}>
                                <Text style={styles.metaText}>👍 {Math.floor(recipe.rating * 20)}%</Text>
                            </View>
                            {recipe.calories && (
                                <>
                                    <View style={styles.verticalDivider} />
                                    <View style={styles.metaItem}>
                                        <Flame size={16} color={THEME.colors.text.secondary} />
                                        <Text style={styles.metaText}>{recipe.calories} kcal</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>{recipe.description}</Text>

                    {/* Quick Tips / Remixes Teaser (Inspiration from request) */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ChefHat size={20} color={THEME.colors.primary} />
                            <Text style={styles.sectionTitle}>Chef's Tips</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
                            {recipe.tips?.map((tip, index) => (
                                <View key={index} style={styles.tipCard}>
                                    <Text style={styles.tipText}>{tip}</Text>
                                </View>
                            )) || (
                                    <View style={styles.tipCard}>
                                        <Text style={styles.tipText}>Great for batch cooking!</Text>
                                    </View>
                                )}
                        </ScrollView>
                    </View>

                    {/* Ingredients */}
                    <View style={styles.section}>
                        <View style={styles.ingredientsHeader}>
                            <Text style={styles.sectionTitle}>Ingredients</Text>
                            <Text style={styles.servingText}>{recipe.servings || 4} servings</Text>
                        </View>

                        <View style={styles.ingredientsList}>
                            {recipe.ingredients.map((ing, idx) => (
                                <View key={idx} style={styles.ingredientRow}>
                                    <Text style={styles.ingredientAmount}>{ing.amount}</Text>
                                    <Text style={styles.ingredientItem}>{ing.item}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Ingredient Help Button */}
                        <TouchableOpacity
                            style={styles.ingredientHelpBtn}
                            onPress={() => openAssistant('ingredient')}
                        >
                            <RefreshCw size={18} color={THEME.colors.primary} />
                            <Text style={styles.ingredientHelpText}>
                                Missing an ingredient? Let me help!
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Instructions */}
                    <View
                        style={styles.section}
                        onLayout={(e) => setPreparationSectionY(e.nativeEvent.layout.y)}
                    >
                        <Text style={styles.sectionTitle}>Preparation</Text>
                        <View style={styles.metaRow}>
                            <View>
                                <Text style={styles.prepLabel}>Total Time</Text>
                                <Text style={styles.prepValue}>{makeTimeDisplay(recipe.timeMinutes)}</Text>
                            </View>
                            <View style={{ marginLeft: 32 }}>
                                <Text style={styles.prepLabel}>Prep Time</Text>
                                <Text style={styles.prepValue}>{makeTimeDisplay(15)}</Text>
                            </View>
                            <View style={{ marginLeft: 32 }}>
                                <Text style={styles.prepLabel}>Cook Time</Text>
                                <Text style={styles.prepValue}>{makeTimeDisplay(Math.max(0, recipe.timeMinutes - 15))}</Text>
                            </View>
                        </View>

                        <View style={styles.stepsContainer}>
                            {recipe.instructions.map((step, idx) => (
                                <View
                                    key={idx}
                                    style={styles.stepRow}
                                >
                                    <View style={styles.stepNumberContainer}>
                                        <Text style={styles.stepNumber}>{idx + 1}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Allergens Warning */}
                    {recipe.allergens && recipe.allergens.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.allergenHeader}>
                                <AlertTriangle size={20} color="#D97706" />
                                <Text style={styles.allergenTitle}>Contains Allergens</Text>
                            </View>
                            <View style={styles.allergenContainer}>
                                {recipe.allergens.map((allergen, idx) => (
                                    <View key={idx} style={styles.allergenTag}>
                                        <Text style={styles.allergenText}>
                                            {ALLERGEN_LABELS[allergen] || allergen}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Storage Information */}
                    {recipe.storage && (
                        <View style={styles.section}>
                            <View style={styles.storageContainer}>
                                <Refrigerator size={20} color={THEME.colors.secondary} />
                                <View style={styles.storageContent}>
                                    <Text style={styles.storageTitle}>Storage</Text>
                                    <Text style={styles.storageText}>{recipe.storage}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Recipe Assistant Bottom Sheet */}
            {recipe && (
                <RecipeAssistantSheet
                    visible={showAssistant}
                    onClose={closeAssistant}
                    recipe={recipe}
                    mode={assistantMode}
                />
            )}

            {/* Floating Action Button for Progress Check */}
            {showProgressFAB && (
                <Animated.View style={[styles.fab, { opacity: fabFadeAnim }]}>
                    <TouchableOpacity
                        style={styles.fabButton}
                        onPress={() => openAssistant('progress')}
                        activeOpacity={0.8}
                    >
                        <ChefHat size={26} color="#FFF" strokeWidth={2} />
                    </TouchableOpacity>
                </Animated.View>
            )}

        </View>
    );
}

function makeTimeDisplay(mins: number) {
    if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        return `${hrs} hr ${m} min`;
    }
    return `${mins} min`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    errorText: {
        fontSize: 18,
        color: THEME.colors.text.secondary,
        fontFamily: THEME.fonts.body,
    },
    backButtonGeneric: {
        padding: 12,
        backgroundColor: THEME.colors.ui.inputBg,
        borderRadius: 8,
    },
    backButtonText: {
        color: THEME.colors.primary,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        height: IMG_HEIGHT,
        width: width,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100, // Gradient for status bar visibility
        backgroundColor: 'rgba(0,0,0,0.1)', // Very light overlay, customize with gradient if possible
    },
    topBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        zIndex: 10,
    },
    topRightButtons: {
        flexDirection: 'row',
    },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: THEME.colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32, // Overlap the image
        paddingTop: 32,
        paddingHorizontal: 24,
    },
    headerSection: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        marginBottom: 8,
        lineHeight: 34,
    },
    tagBadge: {
        alignSelf: 'flex-start',
        backgroundColor: THEME.colors.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    tagText: {
        fontSize: 13,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.primary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
    },
    verticalDivider: {
        width: 1,
        height: 14,
        backgroundColor: THEME.colors.ui.border,
        marginHorizontal: 16,
    },
    description: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        lineHeight: 24,
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        marginBottom: 16,
    },
    ingredientsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    servingControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.ui.inputBg,
        borderRadius: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    servingBtn: {
        padding: 4,
    },
    servingText: {
        paddingHorizontal: 8,
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
    },
    ingredientsList: {
        marginBottom: 16,
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.ui.border,
    },
    ingredientItem: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        flex: 1,
    },
    ingredientAmount: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
        marginRight: 16,
        width: 80, // Fixed width for alignment
    },
    addToCartBtn: {
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
        borderRadius: 12,
        alignItems: 'center',
    },
    addToCartText: {
        color: THEME.colors.primary,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    prepLabel: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        marginBottom: 4,
    },
    prepValue: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
    },
    stepsContainer: {
        marginTop: 16,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    stepNumberContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: THEME.colors.ui.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    stepNumber: {
        fontSize: 12,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.primary,
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
    },
    tipsScroll: {
        marginLeft: -24,
        paddingLeft: 24,
    },
    tipCard: {
        backgroundColor: '#FFF8F0', // Light orange/yellow
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        width: 200,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    tipText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: '#E65100', // Darker orange
        lineHeight: 20,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.9)', // Slight translucent background
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    startCookingBtn: {
        backgroundColor: THEME.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        gap: 8,
    },
    startCookingText: {
        fontSize: 18,
        fontFamily: THEME.fonts.bodySemiBold,
        color: 'white',
    },
    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.colors.background,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    // Allergen styles
    allergenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    allergenTitle: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: '#D97706',
    },
    allergenContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    allergenTag: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    allergenText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: '#92400E',
    },
    // Storage styles
    storageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#86EFAC',
        gap: 12,
    },
    storageContent: {
        flex: 1,
    },
    storageTitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.secondary,
        marginBottom: 4,
    },
    storageText: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        lineHeight: 20,
    },
    ingredientHelpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(224, 122, 95, 0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(224, 122, 95, 0.2)',
        gap: 10,
        marginTop: 8,
    },
    ingredientHelpText: {
        fontSize: 15,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.primary,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 100,
        zIndex: 999,
    },
    fabButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
