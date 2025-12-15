import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Utensils, Check } from 'lucide-react-native';
import { useRecipeOnboardingStore, getDefaultFeedingTypes, FeedingTypes } from '@/src/shared/stores/recipeStore';
import { useChildStore } from '@/src/shared/stores/childStore';
import { THEME, FEEDING_TYPES_DATA } from '@/src/lib/constants';

export default function SmartConfirmStep() {
    const { activeChild } = useChildStore();
    const { preferences, setFeedingTypes, nextStep } = useRecipeOnboardingStore();

    // Calculate child age in months and set defaults on mount
    useEffect(() => {
        if (activeChild?.birth_date) {
            const birthDate = new Date(activeChild.birth_date);
            const now = new Date();
            const ageMonths = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

            console.log('🔍 SmartConfirmStep Debug:');
            console.log('  Child:', activeChild.name);
            console.log('  Birth Date:', activeChild.birth_date);
            console.log('  Calculated Age (months):', ageMonths);

            // Set age-based defaults, only if not already set or we want to force reset on entry (discussable)
            // For now, we set them based on age. If user toggles, store updates.
            const defaults = getDefaultFeedingTypes(ageMonths);
            console.log('  Calculated Defaults:', JSON.stringify(defaults, null, 2));

            setFeedingTypes(defaults);
            console.log('  ✅ setFeedingTypes called with defaults');
        } else {
            // No child yet - user is expecting
            console.log('⚠️ SmartConfirmStep: No activeChild - assuming expecting mother');
            const defaults = getDefaultFeedingTypes(-1); // -1 = expecting
            setFeedingTypes(defaults);
        }
    }, [activeChild]);

    const childName = activeChild?.name || 'your little one';
    const childAge = activeChild?.birth_date
        ? Math.floor((new Date().getTime() - new Date(activeChild.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : -1; // -1 indicates expecting

    const isExpecting = childAge === -1;

    const toggleType = (key: string) => {
        setFeedingTypes({
            [key]: !preferences.feedingTypes[key as keyof FeedingTypes],
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerSection}>
                <View style={styles.iconContainer}>
                    <Utensils size={40} color={THEME.colors.primary} strokeWidth={1.5} />
                </View>

                <Text style={styles.title}>
                    {isExpecting ? 'Cooking for you' : `Cooking for ${childName}`}
                    {childAge > 0 && ` (${childAge}mo)`}
                </Text>

                <Text style={styles.subtitle}>
                    {isExpecting
                        ? "We've selected recipes for your pregnancy journey. Tap to customize!"
                        : "We've selected the best matches for their age. Tap to customize!"}
                </Text>
            </View>

            <View style={styles.selectionList}>
                {FEEDING_TYPES_DATA.map((type) => {
                    const isSelected = preferences.feedingTypes[type.key as keyof FeedingTypes];
                    return (
                        <TouchableOpacity
                            key={type.key}
                            style={[
                                styles.optionCard,
                                isSelected && styles.optionCardSelected
                            ]}
                            onPress={() => toggleType(type.key)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected
                            ]}>
                                {isSelected && <Check size={14} color={THEME.colors.ui.white} strokeWidth={3} />}
                            </View>

                            <View style={styles.optionContent}>
                                <Text style={[
                                    styles.optionLabel,
                                    isSelected && styles.optionLabelSelected
                                ]}>
                                    {type.label}
                                </Text>
                                <Text style={styles.optionDescription}>
                                    {type.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footerPlaceholder} />

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
                    <Text style={styles.primaryButtonText}>Looks Perfect!</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingTop: 32,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(224, 122, 95, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    selectionList: {
        gap: 12,
        marginBottom: 24, // Reduced from 100
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: THEME.colors.ui.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
        gap: 16,
    },
    optionCardSelected: {
        borderColor: THEME.colors.primary,
        backgroundColor: 'rgba(224, 122, 95, 0.05)',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: THEME.colors.text.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: THEME.colors.primary,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    optionDescription: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    footerPlaceholder: {
        height: 180, // Enough space for button + padding + tab bar
    },
    footer: {
        position: 'absolute',
        bottom: 100, // Account for tab bar (typically 80-100px)
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 24,
        backgroundColor: THEME.colors.background, // Ensure background covers list when scrolling
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    primaryButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: THEME.layout.borderRadius.md,
        alignItems: 'center',
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.light,
    },
});
