import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '@/src/lib/constants';

interface FilterOption {
    id: string;
    label: string;
    emoji?: string;
}

interface CuisineFilterProps {
    options: FilterOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    containerStyle?: object;
    contentContainerStyle?: object;
}

export default function CuisineFilter({
    options,
    selectedId,
    onSelect,
    containerStyle,
    contentContainerStyle
}: CuisineFilterProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
            >
                {options.map((option) => {
                    const isSelected = selectedId === option.id;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.pill, isSelected && styles.pillActive]}
                            onPress={() => onSelect(option.id)}
                        >
                            {option.emoji && <Text style={styles.emoji}>{option.emoji}</Text>}
                            <Text style={[styles.label, isSelected && styles.labelActive]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    contentContainer: {
        paddingHorizontal: 24,
        gap: 12,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        // Ghost style
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: THEME.colors.ui.border,
    },
    pillActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    emoji: {
        fontSize: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.text.secondary,
    },
    labelActive: {
        color: THEME.colors.ui.white,
        fontFamily: THEME.fonts.bodySemiBold,
    },
});
