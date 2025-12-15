import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRecipeOnboardingStore } from '@/src/shared/stores/recipeStore';
import { THEME } from '@/src/lib/constants';

const DIETARY_OPTIONS = [
    { id: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
    { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
    { id: 'nut-free', label: 'Nut-Free', emoji: '🥜' },
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
    { id: 'vegan', label: 'Vegan', emoji: '🌱' },
    { id: 'breastfeeding', label: 'Breastfeeding-Friendly', emoji: '🤱' },
    { id: 'pregnancy', label: 'Pregnancy-Safe', emoji: '🤰' },
];

export default function DietaryStep() {
    const { preferences, setDietaryNeeds, nextStep, prevStep } = useRecipeOnboardingStore();

    const toggleDietary = (id: string) => {
        const current = preferences.dietaryNeeds;
        if (current.includes(id)) {
            setDietaryNeeds(current.filter((item) => item !== id));
        } else {
            setDietaryNeeds([...current, id]);
        }
    };

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <Heart size={48} color={THEME.colors.primary} strokeWidth={1.5} />
                </View>

                <Text style={styles.title}>Any dietary needs?</Text>
                <Text style={styles.subtitle}>We'll filter recipes to match your family's diet</Text>

                <View style={styles.optionsGrid}>
                    {DIETARY_OPTIONS.map((option) => {
                        const isSelected = preferences.dietaryNeeds.includes(option.id);
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.optionChip, isSelected && styles.optionChipActive]}
                                onPress={() => toggleDietary(option.id)}
                            >
                                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.hint}>Select all that apply (or skip if none)</Text>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
                    <Text style={styles.primaryButtonText}>Continue</Text>
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
        alignItems: 'center',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(224, 122, 95, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
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
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: THEME.colors.ui.border,
        backgroundColor: THEME.colors.ui.white,
    },
    optionChipActive: {
        borderColor: THEME.colors.primary,
        backgroundColor: 'rgba(224, 122, 95, 0.1)',
    },
    optionEmoji: {
        fontSize: 18,
    },
    optionLabel: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
    },
    optionLabelActive: {
        color: THEME.colors.primary,
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
