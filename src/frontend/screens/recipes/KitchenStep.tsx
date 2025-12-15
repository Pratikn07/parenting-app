import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { useRecipeOnboardingStore } from '@/src/shared/stores/recipeStore';
import { THEME } from '@/src/lib/constants';

const KITCHEN_OPTIONS = [
    { id: 'quick', label: 'Quick & Easy', description: '15-min meals', emoji: '⏱️' },
    { id: 'confident', label: 'Confident Cook', description: 'Love to experiment', emoji: '🍳' },
    { id: 'batch', label: 'Batch Cooking', description: 'Meal prep master', emoji: '❄️' },
    { id: 'picky', label: 'Picky Eaters', description: 'Kid-approved only', emoji: '🫣' },
    { id: 'treats', label: 'Treats & Desserts', description: 'Sweet tooth', emoji: '🍬' },
];

import { useAuthStore } from '@/src/shared/stores/authStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { supabase } from '@/src/lib/supabase';
import { feedingTypesToArray } from '@/src/shared/stores/recipeStore';

export default function KitchenStep() {
    const { preferences, setKitchenStyle, completeOnboarding, prevStep } = useRecipeOnboardingStore();
    const { user } = useAuthStore();
    const { activeChild } = useChildStore();

    const handleComplete = async () => {
        // Update local state immediately for UI responsiveness
        completeOnboarding();

        // Prepare data for DB
        const feedingTypesArray = feedingTypesToArray(preferences.feedingTypes);

        // Update parent profile: onboarding status + kitchen styles
        if (user?.id) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    has_completed_recipe_onboarding: true,
                    kitchen_styles: preferences.kitchenStyle,
                })
                .eq('id', user.id);

            if (profileError) console.error('Failed to update profile:', profileError);
        }

        // Update/insert child preferences: dietary needs + feeding types
        if (activeChild?.id) {
            const { error: childPrefError } = await supabase
                .from('child_preferences')
                .upsert({
                    child_id: activeChild.id,
                    dietary_needs: preferences.dietaryNeeds,
                    feeding_types: feedingTypesArray,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'child_id' });

            if (childPrefError) console.error('Failed to update child preferences:', childPrefError);
        }
    };

    const toggleKitchen = (id: string) => {
        const current = preferences.kitchenStyle;
        if (current.includes(id)) {
            setKitchenStyle(current.filter((item) => item !== id));
        } else if (current.length < 2) {
            setKitchenStyle([...current, id]);
        } else {
            // Replace first item if max reached
            setKitchenStyle([current[1], id]);
        }
    };

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <ChefHat size={48} color={THEME.colors.primary} strokeWidth={1.5} />
                </View>

                <Text style={styles.title}>Your kitchen reality</Text>
                <Text style={styles.subtitle}>Pick up to 2 that describe you best</Text>

                <View style={styles.optionsList}>
                    {KITCHEN_OPTIONS.map((option) => {
                        const isSelected = preferences.kitchenStyle.includes(option.id);
                        const isDisabled = !isSelected && preferences.kitchenStyle.length >= 2;

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardActive,
                                    isDisabled && styles.optionCardDisabled,
                                ]}
                                onPress={() => toggleKitchen(option.id)}
                                disabled={isDisabled}
                            >
                                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                <View style={styles.optionInfo}>
                                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                                        {option.label}
                                    </Text>
                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                </View>
                                {isSelected && <View style={styles.selectedBadge} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.hint}>We'll prioritize recipes that match your style</Text>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
                    <Text style={styles.primaryButtonText}>Get Started!</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 32,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(224, 122, 95, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    optionsList: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: THEME.colors.ui.border,
        backgroundColor: THEME.colors.ui.white,
    },
    optionCardActive: {
        borderColor: THEME.colors.primary,
        backgroundColor: 'rgba(224, 122, 95, 0.05)',
    },
    optionCardDisabled: {
        opacity: 0.4,
    },
    optionEmoji: {
        fontSize: 32,
    },
    optionInfo: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
        marginBottom: 4,
    },
    optionLabelActive: {
        color: THEME.colors.primary,
    },
    optionDescription: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    selectedBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: THEME.colors.primary,
    },
    hint: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
        marginTop: 32,
        fontStyle: 'italic',
    },
    footer: {
        padding: 24,
        gap: 8,
        paddingBottom: 100,
    },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: THEME.layout.borderRadius.md,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.light,
    },
    backButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.secondary,
    },
});
