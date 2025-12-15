import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { BlurView } from 'expo-blur';

interface FilterOption {
    id: string;
    label: string;
    emoji?: string;
}

interface RecipeFilterModalProps {
    visible: boolean;
    onClose: () => void;
    cuisineOptions: FilterOption[];
    selectedCuisine: string;
    onSelectCuisine: (id: string) => void;
}

export default function RecipeFilterModal({
    visible,
    onClose,
    cuisineOptions,
    selectedCuisine,
    onSelectCuisine
}: RecipeFilterModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Filters</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={20} color={THEME.colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Cuisines Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Cuisines</Text>
                                    <View style={styles.optionsGrid}>
                                        {cuisineOptions.map((option) => {
                                            const isSelected = selectedCuisine === option.id;
                                            return (
                                                <TouchableOpacity
                                                    key={option.id}
                                                    style={[styles.option, isSelected && styles.optionSelected]}
                                                    onPress={() => onSelectCuisine(option.id)}
                                                >
                                                    <Text style={styles.emoji}>{option.emoji}</Text>
                                                    <Text style={[styles.label, isSelected && styles.labelSelected]}>
                                                        {option.label}
                                                    </Text>
                                                    {isSelected && (
                                                        <View style={styles.checkIcon}>
                                                            <Check size={12} color={THEME.colors.ui.white} strokeWidth={3} />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Future Sections (Prep Time, etc) can go here */}
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.applyButtonText}>Show Recipes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: THEME.colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.colors.ui.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
        marginBottom: 12,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: THEME.colors.ui.white,
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    optionSelected: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    emoji: {
        fontSize: 18,
    },
    label: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.primary,
    },
    labelSelected: {
        color: THEME.colors.ui.white,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    checkIcon: {
        marginLeft: 4,
    },
    footer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.ui.border,
    },
    applyButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    applyButtonText: {
        color: THEME.colors.ui.white,
        fontSize: 16,
        fontFamily: THEME.fonts.bodySemiBold,
    },
});
