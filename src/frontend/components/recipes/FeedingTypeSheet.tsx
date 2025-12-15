import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useRecipeOnboardingStore } from '@/src/shared/stores/recipeStore';
import { THEME } from '@/src/lib/constants';

interface FeedingTypeSheetProps {
    visible: boolean;
    onClose: () => void;
}

const FEEDING_TYPES = [
    { key: 'babyPurees', label: 'Baby Purees', description: 'Smooth purees, first foods (4-8mo)' },
    { key: 'fingerFoods', label: 'Finger Foods', description: 'Soft, graspable pieces (8-18mo)' },
    { key: 'toddlerMeals', label: 'Toddler Meals', description: 'Age-appropriate portions (12mo-3yr)' },
    { key: 'familyDinners', label: 'Family Dinners', description: 'One-pot meals for everyone' },
    { key: 'lunchboxIdeas', label: 'Lunchbox Ideas', description: 'Daycare/school-ready meals' },
    { key: 'treatsSnacks', label: 'Treats & Snacks', description: 'Healthy-ish sweets' },
];

export default function FeedingTypeSheet({ visible, onClose }: FeedingTypeSheetProps) {
    const { preferences, setFeedingTypes } = useRecipeOnboardingStore();

    const toggleType = (key: string) => {
        setFeedingTypes({
            [key]: !preferences.feedingTypes[key as keyof typeof preferences.feedingTypes],
        });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Customize Feeding Types</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={THEME.colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {FEEDING_TYPES.map((type) => {
                        const isSelected = preferences.feedingTypes[type.key as keyof typeof preferences.feedingTypes];
                        return (
                            <TouchableOpacity
                                key={type.key}
                                style={styles.typeItem}
                                onPress={() => toggleType(type.key)}
                            >
                                <View style={styles.typeInfo}>
                                    <Text style={styles.typeLabel}>{type.label}</Text>
                                    <Text style={styles.typeDescription}>{type.description}</Text>
                                </View>
                                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                    {isSelected && <View style={styles.checkboxInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.ui.border,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    typeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.ui.border,
    },
    typeInfo: {
        flex: 1,
        marginRight: 16,
    },
    typeLabel: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
        marginBottom: 4,
    },
    typeDescription: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: THEME.colors.ui.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        borderColor: THEME.colors.primary,
        backgroundColor: THEME.colors.primary,
    },
    checkboxInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: THEME.colors.ui.white,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    doneButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: THEME.layout.borderRadius.md,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.light,
    },
});
