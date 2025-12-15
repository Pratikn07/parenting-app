import React, { useEffect } from 'react';
import { useRecipeOnboardingStore, arrayToFeedingTypes } from '@/src/shared/stores/recipeStore';
import RecipesOnboarding from '@/src/frontend/screens/recipes/RecipesOnboarding';
import RecipesHome from '@/src/frontend/screens/recipes/RecipesHome';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';

export default function RecipesScreen() {
    const {
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        setFeedingTypes,
        setDietaryNeeds,
        setKitchenStyle,
    } = useRecipeOnboardingStore();
    const { user } = useAuthStore();
    const { activeChild } = useChildStore();

    // Load preferences from database (children are loaded globally in _layout.tsx)
    useEffect(() => {
        const syncPreferences = async () => {
            if (!user?.id) return;

            console.log('🔄 RecipesScreen: Syncing preferences from DB for user:', user.email);

            // Fetch profile data (onboarding status + kitchen styles)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('has_completed_recipe_onboarding, kitchen_styles')
                .eq('id', user.id)
                .single();

            if (!profileError && profileData) {
                console.log('📊 Profile data:', profileData);
                if (profileData.has_completed_recipe_onboarding !== hasCompletedOnboarding) {
                    setHasCompletedOnboarding(profileData.has_completed_recipe_onboarding);
                }
                if (profileData.kitchen_styles && profileData.kitchen_styles.length > 0) {
                    setKitchenStyle(profileData.kitchen_styles);
                }
            }

            // Fetch child preferences (dietary needs + feeding types)
            if (activeChild?.id) {
                console.log('👶 Fetching preferences for child:', activeChild.name);
                const { data: childPrefData, error: childPrefError } = await supabase
                    .from('child_preferences')
                    .select('dietary_needs, feeding_types')
                    .eq('child_id', activeChild.id)
                    .single();

                if (!childPrefError && childPrefData) {
                    console.log('📊 Child preferences:', childPrefData);
                    if (childPrefData.dietary_needs && childPrefData.dietary_needs.length > 0) {
                        setDietaryNeeds(childPrefData.dietary_needs);
                    }
                    if (childPrefData.feeding_types && childPrefData.feeding_types.length > 0) {
                        setFeedingTypes(arrayToFeedingTypes(childPrefData.feeding_types));
                    }
                } else if (childPrefError && childPrefError.code !== 'PGRST116') {
                    // PGRST116 = no rows returned, which is fine (no prefs saved yet)
                    console.error('❌ Error loading child preferences:', childPrefError);
                }
            }
        };

        syncPreferences();
    }, [user?.id, activeChild?.id]);

    if (!hasCompletedOnboarding) {
        return <RecipesOnboarding />;
    }

    return <RecipesHome />;
}
