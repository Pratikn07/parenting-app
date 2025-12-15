import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface RecipeSectionProps {
    title: string;
    subtitle?: string;
    onSeeAll?: () => void;
    children: React.ReactNode;
}

export default function RecipeSection({ title, subtitle, onSeeAll, children }: RecipeSectionProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

                {onSeeAll && (
                    <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
                        <Text style={styles.seeAllText}>See all</Text>
                        <ArrowRight size={16} color={THEME.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={296} // Card width + margin
            >
                {children}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        marginTop: 2,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 16,
        paddingVertical: 4,
    },
    seeAllText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodyMedium,
        color: THEME.colors.primary,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingRight: 8, // Adjust for last item margin
    },
});
