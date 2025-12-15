import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeedingTypes {
    pregnancyNutrition: boolean; // For expecting mothers
    babyPurees: boolean;      // 4-10mo
    fingerFoods: boolean;     // 8-24mo
    toddlerMeals: boolean;    // 12mo-4yr
    familyDinners: boolean;   // 12mo+
    lunchboxIdeas: boolean;   // 3yr+
    treatsSnacks: boolean;    // Opt-in
}

export interface RecipePreferences {
    feedingTypes: FeedingTypes;
    dietaryNeeds: string[];   // ['dairy-free', 'nut-free', ...]
    kitchenStyle: string[];   // max 2: ['quick', 'batch-cooking', ...]
}

interface RecipeOnboardingState {
    hasCompletedOnboarding: boolean;
    currentStep: number;
    preferences: RecipePreferences;

    // Actions
    setFeedingTypes: (types: Partial<FeedingTypes>) => void;
    setDietaryNeeds: (needs: string[]) => void;
    setKitchenStyle: (styles: string[]) => void;
    nextStep: () => void;
    prevStep: () => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
    setHasCompletedOnboarding: (status: boolean) => void;
}

// Helper function to get default feeding types based on child age in months
// If ageMonths is -1, assumes user is expecting (no child yet)
export function getDefaultFeedingTypes(ageMonths: number): FeedingTypes {
    return {
        pregnancyNutrition: ageMonths === -1, // Expecting mothers
        babyPurees: ageMonths >= 4 && ageMonths < 10,
        fingerFoods: ageMonths >= 8 && ageMonths < 24,
        toddlerMeals: ageMonths >= 12 && ageMonths < 48,
        familyDinners: ageMonths >= 12,
        lunchboxIdeas: ageMonths >= 36,
        treatsSnacks: false, // User opts in
    };
}

// Convert FeedingTypes object to array of enabled keys (for DB storage)
export function feedingTypesToArray(types: FeedingTypes): string[] {
    return Object.entries(types)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);
}

// Convert array back to FeedingTypes object (from DB)
export function arrayToFeedingTypes(arr: string[]): FeedingTypes {
    return {
        pregnancyNutrition: arr.includes('pregnancyNutrition'),
        babyPurees: arr.includes('babyPurees'),
        fingerFoods: arr.includes('fingerFoods'),
        toddlerMeals: arr.includes('toddlerMeals'),
        familyDinners: arr.includes('familyDinners'),
        lunchboxIdeas: arr.includes('lunchboxIdeas'),
        treatsSnacks: arr.includes('treatsSnacks'),
    };
}

const DEFAULT_PREFERENCES: RecipePreferences = {
    feedingTypes: {
        pregnancyNutrition: false,
        babyPurees: false,
        fingerFoods: false,
        toddlerMeals: false,
        familyDinners: false, // All false by default; age-based logic sets actual defaults
        lunchboxIdeas: false,
        treatsSnacks: false,
    },
    dietaryNeeds: [],
    kitchenStyle: [],
};

export const useRecipeOnboardingStore = create<RecipeOnboardingState>()(
    persist(
        (set, get) => ({
            hasCompletedOnboarding: false,
            currentStep: 1,
            preferences: DEFAULT_PREFERENCES,

            setFeedingTypes: (types) => {
                console.log('📝 setFeedingTypes called with:', types);
                console.log('   Current state before merge:', get().preferences.feedingTypes);

                set((state) => {
                    const newFeedingTypes = {
                        ...state.preferences.feedingTypes,
                        ...types,
                    };
                    console.log('   New state after merge:', newFeedingTypes);

                    return {
                        preferences: {
                            ...state.preferences,
                            feedingTypes: newFeedingTypes,
                        },
                    };
                });
            },

            setDietaryNeeds: (needs) => {
                set((state) => ({
                    preferences: {
                        ...state.preferences,
                        dietaryNeeds: needs,
                    },
                }));
            },

            setKitchenStyle: (styles) => {
                // Limit to max 2
                const limitedStyles = styles.slice(0, 2);
                set((state) => ({
                    preferences: {
                        ...state.preferences,
                        kitchenStyle: limitedStyles,
                    },
                }));
            },

            nextStep: () => {
                const current = get().currentStep;
                if (current < 3) {
                    set({ currentStep: current + 1 });
                }
            },

            prevStep: () => {
                const current = get().currentStep;
                if (current > 1) {
                    set({ currentStep: current - 1 });
                }
            },

            completeOnboarding: () => {
                set({ hasCompletedOnboarding: true, currentStep: 1 });
            },

            resetOnboarding: () => {
                set({
                    hasCompletedOnboarding: false,
                    currentStep: 1,
                    preferences: DEFAULT_PREFERENCES,
                });
            },

            setHasCompletedOnboarding: (status) => {
                set({ hasCompletedOnboarding: status });
            },
        }),
        {
            name: 'recipe-onboarding',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                hasCompletedOnboarding: state.hasCompletedOnboarding,
                preferences: state.preferences,
            }),
        }
    )
);
